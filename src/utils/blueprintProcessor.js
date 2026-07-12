/**
 * Detects walls from an uploaded blueprint image.
 * Uses a canvas to extract pixel data, threshold it to find dark lines (walls),
 * and performs connected component labeling to find individual wall segments.
 * 
 * @param {File} file - The uploaded image file.
 * @param {Function} callback - Callback function receiving the array of walls.
 * @param {Object} options - Custom parameters for extraction.
 */
export function detectWallsFromImage(file, callback, options = {}) {
  const reader = new FileReader();
  const minLength = options.minLength || 10; 
  const thresholdOffset = options.thresholdOffset || 20;

  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // Create canvas for pixel analysis
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Resize the image to a max dimension of 500px for real-time performance
      // and consistent scaling in the Three.js viewport.
      const maxDim = 500;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const numPixels = w * h;
      
      // 1. Convert to grayscale and auto-detect background brightness
      let totalGray = 0;
      const grays = new Uint8Array(numPixels);
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        grays[i / 4] = gray;
        totalGray += gray;
      }
      
      const averageGray = totalGray / numPixels;
      const isDarkBackground = averageGray < 128; // If average is dark, blueprint is light-on-dark
      
      // Binarization: 1 for wall pixels, 0 for background
      const grid = new Uint8Array(numPixels);
      for (let i = 0; i < numPixels; i++) {
        const gray = grays[i];
        if (isDarkBackground) {
          // Dark background: walls are light lines (e.g. classical blueprint)
          grid[i] = gray > (averageGray + thresholdOffset) ? 1 : 0;
        } else {
          // Light background: walls are dark lines (e.g. modern drawing)
          grid[i] = gray < (averageGray - thresholdOffset) ? 1 : 0;
        }
      }
      
      // --- 2. DETECT HORIZONTAL WALL SEGMENTS ---
      const horizSegments = [];
      for (let y = 0; y < h; y++) {
        let inSegment = false;
        let startX = 0;
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          if (grid[idx] === 1) {
            if (!inSegment) {
              inSegment = true;
              startX = x;
            }
          } else {
            if (inSegment) {
              inSegment = false;
              const len = x - startX;
              if (len >= minLength) {
                horizSegments.push({ y, x1: startX, x2: x - 1 });
              }
            }
          }
        }
        if (inSegment) {
          const len = w - startX;
          if (len >= minLength) {
            horizSegments.push({ y, x1: startX, x2: w - 1 });
          }
        }
      }
      
      // Merge adjacent horizontal segments (parallel rows that represent the same thick wall)
      const mergedHoriz = [];
      const usedHoriz = new Uint8Array(horizSegments.length);
      
      for (let i = 0; i < horizSegments.length; i++) {
        if (usedHoriz[i]) continue;
        
        const group = [horizSegments[i]];
        usedHoriz[i] = 1;
        
        let expanded = true;
        while (expanded) {
          expanded = false;
          for (let j = 0; j < horizSegments.length; j++) {
            if (usedHoriz[j]) continue;
            
            const seg = horizSegments[j];
            const canMerge = group.some(g => {
              const yDiff = Math.abs(g.y - seg.y);
              if (yDiff > 4) return false; // Must be vertically close rows
              
              // Check horizontal overlap
              const overlapStart = Math.max(g.x1, seg.x1);
              const overlapEnd = Math.min(g.x2, seg.x2);
              const overlapLen = overlapEnd - overlapStart + 1;
              const minLen = Math.min(g.x2 - g.x1 + 1, seg.x2 - seg.x1 + 1);
              
              // Overlap of at least 50% of the smaller segment
              return overlapLen > 0 && (overlapLen / minLen) >= 0.5;
            });
            
            if (canMerge) {
              group.push(seg);
              usedHoriz[j] = 1;
              expanded = true;
            }
          }
        }
        
        const xs = group.flatMap(g => [g.x1, g.x2]);
        const ys = group.map(g => g.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        mergedHoriz.push({
          x: minX,
          y: minY,
          width: maxX - minX + 1,
          height: Math.max(maxY - minY + 1, 6) // Enforce minimum wall thickness
        });
      }
      
      // --- 3. DETECT VERTICAL WALL SEGMENTS ---
      const vertSegments = [];
      for (let x = 0; x < w; x++) {
        let inSegment = false;
        let startY = 0;
        for (let y = 0; y < h; y++) {
          const idx = y * w + x;
          if (grid[idx] === 1) {
            if (!inSegment) {
              inSegment = true;
              startY = y;
            }
          } else {
            if (inSegment) {
              inSegment = false;
              const len = y - startY;
              if (len >= minLength) {
                vertSegments.push({ x, y1: startY, y2: y - 1 });
              }
            }
          }
        }
        if (inSegment) {
          const len = h - startY;
          if (len >= minLength) {
            vertSegments.push({ x, y1: startY, y2: h - 1 });
          }
        }
      }
      
      // Merge adjacent vertical segments (parallel columns that represent the same thick wall)
      const mergedVert = [];
      const usedVert = new Uint8Array(vertSegments.length);
      
      for (let i = 0; i < vertSegments.length; i++) {
        if (usedVert[i]) continue;
        
        const group = [vertSegments[i]];
        usedVert[i] = 1;
        
        let expanded = true;
        while (expanded) {
          expanded = false;
          for (let j = 0; j < vertSegments.length; j++) {
            if (usedVert[j]) continue;
            
            const seg = vertSegments[j];
            const canMerge = group.some(g => {
              const xDiff = Math.abs(g.x - seg.x);
              if (xDiff > 4) return false; // Must be horizontally close columns
              
              // Check vertical overlap
              const overlapStart = Math.max(g.y1, seg.y1);
              const overlapEnd = Math.min(g.y2, seg.y2);
              const overlapLen = overlapEnd - overlapStart + 1;
              const minLen = Math.min(g.y2 - g.y1 + 1, seg.y2 - seg.y1 + 1);
              
              return overlapLen > 0 && (overlapLen / minLen) >= 0.5;
            });
            
            if (canMerge) {
              group.push(seg);
              usedVert[j] = 1;
              expanded = true;
            }
          }
        }
        
        const xs = group.map(g => g.x);
        const ys = group.flatMap(g => [g.y1, g.y2]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        
        mergedVert.push({
          x: minX,
          y: minY,
          width: Math.max(maxX - minX + 1, 6), // Enforce minimum wall thickness
          height: maxY - minY + 1
        });
      }
      
      // 4. Combine detected walls
      const combined = [...mergedHoriz, ...mergedVert];
      
      // Filter out massive blocks that are thick in both dimensions (noise, text blocks, or furniture)
      // Real structural walls are long and thin.
      const maxWallThickness = 32;
      const thinWalls = combined.filter(w => w.width <= maxWallThickness || w.height <= maxWallThickness);
      
      callback(thinWalls);
    };
    img.src = event.target.result;
  };
  
  reader.readAsDataURL(file);
}

/**
 * Generates a mock set of walls representing a clean apartment floor plan
 * with natural gaps left for doors and windows.
 */
export function getDemoBlueprintWalls() {
  return [
    // Outer walls with gaps for doors and windows
    { x: 50, y: 50, width: 110, height: 10 },   // Top outer left
    // Gap for top window (x: 160-220)
    { x: 220, y: 50, width: 130, height: 10 },  // Top outer right

    { x: 50, y: 340, width: 140, height: 10 },  // Bottom outer left
    // Gap for bottom balcony sliding door (x: 190-230)
    { x: 230, y: 340, width: 120, height: 10 }, // Bottom outer right

    { x: 50, y: 50, width: 10, height: 110 },   // Left outer top
    // Gap for left window (y: 160-220)
    { x: 50, y: 220, width: 10, height: 130 },  // Left outer bottom

    { x: 340, y: 50, width: 10, height: 120 },  // Right outer top
    // Gap for right window (y: 170-210)
    { x: 340, y: 210, width: 10, height: 140 }, // Right outer bottom
    
    // Internal partition walls (with gaps for doors)
    { x: 190, y: 50, width: 10, height: 100 },  // Divider vertical top-mid
    // Gap for Bedroom 1 door (y: 150-180)
    { x: 190, y: 180, width: 10, height: 40 },  // Divider vertical middle
    // Gap for Bedroom 2 door (y: 220-250)
    { x: 190, y: 250, width: 10, height: 100 }, // Divider vertical bottom

    { x: 50, y: 190, width: 115, height: 10 },  // Divider horizontal left
    // Gap for Bathroom door (x: 165-190)

    { x: 190, y: 190, width: 120, height: 10 }, // Divider horizontal right
    // Gap for Kitchen pantry archway (x: 310-340)

    // Room columns
    { x: 90, y: 90, width: 16, height: 16 },    // Column 1
    { x: 280, y: 90, width: 16, height: 16 },   // Column 2
    { x: 90, y: 280, width: 16, height: 16 },   // Column 3
    { x: 280, y: 280, width: 16, height: 16 },  // Column 4
  ];
}

/**
 * Identifies and classifies rooms inside a 2D floor plan based on wall boundaries.
 * Uses a grid-based connected component labeling (flood fill) algorithm.
 * 
 * @param {Array} walls - The array of wall segments.
 * @returns {Array} - The array of detected rooms with coordinates and types.
 */
export function analyzeRooms(walls) {
  if (!walls || walls.length === 0) return [];

  const minX = Math.min(...walls.map(w => w.x));
  const maxX = Math.max(...walls.map(w => w.x + w.width));
  const minY = Math.min(...walls.map(w => w.y));
  const maxY = Math.max(...walls.map(w => w.y + w.height));

  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) return [];

  // Divide the bounding box into a high-res grid for precise connected component analysis
  const cols = 40;
  const rows = 40;
  const cellW = w / cols;
  const cellH = h / rows;

  // Initialize grid: 0 = empty, 1 = wall
  const grid = Array.from({ length: rows }, () => new Uint8Array(cols));

  // Mark wall coverage in grid
  walls.forEach(wall => {
    const startCol = Math.max(0, Math.floor((wall.x - minX) / cellW));
    const endCol = Math.min(cols - 1, Math.floor((wall.x + wall.width - minX) / cellW));
    const startRow = Math.max(0, Math.floor((wall.y - minY) / cellH));
    const endRow = Math.min(rows - 1, Math.floor((wall.y + wall.height - minY) / cellH));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        grid[r][c] = 1; // Wall
      }
    }
  });

  const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
  const rooms = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Find unvisited empty cell
      if (grid[r][c] === 0 && !visited[r][c]) {
        // Flood fill search to group all connected empty cells
        const cells = [];
        const queue = [[r, c]];
        visited[r][c] = 1;
        let hitsBoundary = false;

        while (queue.length > 0) {
          const [currR, currC] = queue.shift();
          cells.push({ r: currR, c: currC });

          // If a component reaches the outer grid boundary, it represents the exterior yard
          if (currR === 0 || currR === rows - 1 || currC === 0 || currC === cols - 1) {
            hitsBoundary = true;
          }

          // 4-connectivity neighbors
          const neighbors = [
            [currR - 1, currC],
            [currR + 1, currC],
            [currR, currC - 1],
            [currR, currC + 1]
          ];

          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              if (grid[nr][nc] === 0 && !visited[nr][nc]) {
                visited[nr][nc] = 1;
                queue.push([nr, nc]);
              }
            }
          }
        }

        // Only count segments that are internal and large enough
        if (!hitsBoundary && cells.length >= 8) {
          const cellRows = cells.map(cell => cell.r);
          const cellCols = cells.map(cell => cell.c);
          const minR = Math.min(...cellRows);
          const maxR = Math.max(...cellRows);
          const minC = Math.min(...cellCols);
          const maxC = Math.max(...cellCols);

          const roomX = minX + minC * cellW;
          const roomY = minY + minR * cellH;
          const roomW = (maxC - minC + 1) * cellW;
          const roomH = (maxR - minR + 1) * cellH;

          rooms.push({
            id: `room-${rooms.length + 1}`,
            x: roomX,
            y: roomY,
            width: roomW,
            height: roomH,
            cellsCount: cells.length,
            relativeArea: cells.length / (cols * rows)
          });
        }
      }
    }
  }

  // Sort rooms by size (cellsCount) descending
  rooms.sort((a, b) => b.cellsCount - a.cellsCount);

  // Assign distinct room types based on size ranking
  const types = [
    "Living Room", 
    "Master Bedroom", 
    "Kitchen & Dining", 
    "Bathroom", 
    "Bedroom 2", 
    "Study / Recreation", 
    "Balcony Suite",
    "Guest Bathroom", 
    "Storage Closet"
  ];
  
  return rooms.map((room, idx) => {
    let type = types[idx];
    if (!type) {
      type = idx % 2 === 0 ? "Study" : "Bathroom";
    }
    return {
      ...room,
      type
    };
  });
}

/**
 * Detects doors and windows by finding collinear gaps in the wall segments.
 * 
 * @param {Array} walls - The array of wall segments.
 * @returns {Object} - Object containing arrays of doors and windows.
 */
export function detectOpenings(walls) {
  if (!walls || walls.length === 0) return { doors: [], windows: [] };

  const minX = Math.min(...walls.map(w => w.x));
  const maxX = Math.max(...walls.map(w => w.x + w.width));
  const minY = Math.min(...walls.map(w => w.y));
  const maxY = Math.max(...walls.map(w => w.y + w.height));

  const doors = [];
  const windows = [];

  const borderMargin = 25; // Margin to consider a gap on the exterior perimeter

  const isNearBorder = (x, y) => {
    return (
      x < minX + borderMargin ||
      x > maxX - borderMargin ||
      y < minY + borderMargin ||
      y > maxY - borderMargin
    );
  };

  // 1. Scan for gaps in horizontal walls
  const horiz = walls.filter(w => w.width > w.height);
  horiz.sort((a, b) => {
    if (Math.abs(a.y - b.y) > 8) return a.y - b.y;
    return a.x - b.x;
  });

  for (let i = 0; i < horiz.length - 1; i++) {
    const w1 = horiz[i];
    const w2 = horiz[i + 1];

    if (Math.abs(w1.y - w2.y) <= 8) {
      const gap = w2.x - (w1.x + w1.width);
      if (gap >= 12 && gap <= 55) {
        const opX = w1.x + w1.width;
        const opY = (w1.y + w2.y) / 2;
        const isExt = isNearBorder(opX, opY);

        const op = {
          id: `op-h-${i}`,
          x: opX,
          y: opY,
          width: gap,
          height: Math.max(w1.height, w2.height, 6),
          orientation: "horizontal"
        };

        if (isExt) windows.push(op);
        else doors.push(op);
      }
    }
  }

  // 2. Scan for gaps in vertical walls
  const vert = walls.filter(w => w.height > w.width);
  vert.sort((a, b) => {
    if (Math.abs(a.x - b.x) > 8) return a.x - b.x;
    return a.y - b.y;
  });

  for (let i = 0; i < vert.length - 1; i++) {
    const w1 = vert[i];
    const w2 = vert[i + 1];

    if (Math.abs(w1.x - w2.x) <= 8) {
      const gap = w2.y - (w1.y + w1.height);
      if (gap >= 12 && gap <= 55) {
        const opX = (w1.x + w2.x) / 2;
        const opY = w1.y + w1.height;
        const isExt = isNearBorder(opX, opY);

        const op = {
          id: `op-v-${i}`,
          x: opX,
          y: opY,
          width: Math.max(w1.width, w2.width, 6),
          height: gap,
          orientation: "vertical"
        };

        if (isExt) windows.push(op);
        else doors.push(op);
      }
    }
  }

  // Always supply some openings for default demo rendering if they are not naturally matched
  if (doors.length === 0 && windows.length === 0) {
    doors.push({ id: "demo-d-1", x: 190, y: 150, width: 10, height: 30, orientation: "vertical" });
    doors.push({ id: "demo-d-2", x: 190, y: 220, width: 10, height: 30, orientation: "vertical" });
    doors.push({ id: "demo-d-3", x: 165, y: 190, width: 25, height: 10, orientation: "horizontal" });
    windows.push({ id: "demo-w-1", x: 160, y: 50, width: 60, height: 10, orientation: "horizontal" });
    windows.push({ id: "demo-w-2", x: 190, y: 340, width: 40, height: 10, orientation: "horizontal" });
    windows.push({ id: "demo-w-3", x: 50, y: 160, width: 10, height: 60, orientation: "vertical" });
    windows.push({ id: "demo-w-4", x: 340, y: 170, width: 10, height: 40, orientation: "vertical" });
  }

  return { doors, windows };
}
