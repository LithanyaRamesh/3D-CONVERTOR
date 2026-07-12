import { useState, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { detectOpenings } from "../utils/blueprintProcessor";

// ---------------------------------------------------------
// DRAFTING PAPER GROUND GRID (BLUEPRINT BG)
// ---------------------------------------------------------
function BlueprintGrid({ isBlue = false }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    // Colors
    const bg = isBlue ? "#0c1d3b" : "#f8fafc";
    const gridColor = isBlue ? "rgba(56, 189, 248, 0.08)" : "rgba(37, 99, 235, 0.07)";
    const mainGridColor = isBlue ? "rgba(56, 189, 248, 0.16)" : "rgba(37, 99, 235, 0.14)";
    const textColor = isBlue ? "rgba(56, 189, 248, 0.35)" : "rgba(15, 23, 42, 0.35)";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 1024);

    // Draw grid lines
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1024; i += 16) {
      ctx.strokeStyle = i % 128 === 0 ? mainGridColor : gridColor;
      // Vertical
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1024);
      ctx.stroke();
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(1024, i);
      ctx.stroke();
    }

    // Outer framing lines
    ctx.strokeStyle = mainGridColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, 994, 994);
    ctx.strokeRect(20, 20, 984, 984);

    // Technical Blueprint Compass Rose
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(120, 120, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(120, 65);
    ctx.lineTo(120, 175);
    ctx.moveTo(65, 120);
    ctx.lineTo(175, 120);
    ctx.stroke();
    
    ctx.fillStyle = textColor;
    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillText("N", 115, 60);
    ctx.fillText("S", 115, 192);
    ctx.fillText("W", 46, 125);
    ctx.fillText("E", 185, 125);

    // Technical Info Blocks (Bottom Right)
    ctx.strokeRect(660, 860, 324, 124);
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText("ARCHITECTURAL BLUEPRINT 3D RENDER", 675, 885);
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillText("SCALE: 1:50 METRIC", 675, 910);
    ctx.fillText("ENGINE: AI CAD INTERIOR V2.5", 675, 930);
    ctx.fillText("STATUS: STABLE REALISTIC LAYOUT", 675, 950);
    ctx.fillText("SHEET: A-101 (ROOMS)", 675, 970);

    // Graphic decorative circle
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.arc(512, 512, 280, 0, Math.PI * 2);
    ctx.stroke();

    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, [isBlue]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
      <planeGeometry args={[110, 110]} />
      <meshStandardMaterial map={texture} roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

// ---------------------------------------------------------
// HOUSE BASEMENT SLAB (FOUNDATION)
// ---------------------------------------------------------
function HouseFoundation({ minX, maxX, minY, maxY, centerX, centerY, isHolo = false }) {
  const w = (maxX - minX) / 40 + 1.6;
  const h = (maxY - minY) / 40 + 1.6;
  const posX = (minX + maxX) / 2 - centerX;
  const posZ = (minY + maxY) / 2 - centerY;

  if (isHolo) {
    return (
      <mesh position={[posX / 40, 0.01, posZ / 40]}>
        <boxGeometry args={[w, 0.02, h]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.3} />
      </mesh>
    );
  }

  return (
    <mesh position={[posX / 40, 0.01, posZ / 40]} receiveShadow castShadow>
      <boxGeometry args={[w, 0.02, h]} />
      <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
    </mesh>
  );
}

// ---------------------------------------------------------
// WALL SEGMENTS
// ---------------------------------------------------------
function Wall({ x, y, width, height, centerX, centerY, wallHeight = 0.9, wallColor = "#f8fafc", isHolo = false }) {
  const adjustedPosX = (x + width / 2 - centerX) / 40;
  const adjustedPosZ = (y + height / 2 - centerY) / 40;
  
  const sizeX = Math.max(width / 40, 0.15);
  const sizeZ = Math.max(height / 40, 0.15);

  if (isHolo) {
    return (
      <mesh position={[adjustedPosX, wallHeight / 2 + 0.02, adjustedPosZ]}>
        <boxGeometry args={[sizeX, wallHeight, sizeZ]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.6} />
      </mesh>
    );
  }

  return (
    <group>
      {/* Plaster Body */}
      <mesh position={[adjustedPosX, wallHeight / 2 + 0.02, adjustedPosZ]} castShadow receiveShadow>
        <boxGeometry args={[sizeX, wallHeight, sizeZ]} />
        <meshStandardMaterial 
          color={wallColor} 
          roughness={0.9} 
          metalness={0.02}
        />
      </mesh>
      {/* Baseboard Trim (Dark Wood Accent) */}
      <mesh position={[adjustedPosX, 0.045, adjustedPosZ]} castShadow>
        <boxGeometry args={[sizeX + 0.006, 0.06, sizeZ + 0.006]} />
        <meshStandardMaterial color="#451a03" roughness={0.65} />
      </mesh>
      {/* Top Border Trim (Slate/Metal Cap) */}
      <mesh position={[adjustedPosX, wallHeight + 0.025, adjustedPosZ]} castShadow>
        <boxGeometry args={[sizeX + 0.008, 0.015, sizeZ + 0.008]} />
        <meshStandardMaterial 
          color="#334155" 
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------
// REALISTIC WINDOWS AND DOORS
// ---------------------------------------------------------
function Window3D({ x, y, width, height, centerX, centerY, wallHeight = 0.9 }) {
  const adjustedPosX = (x + width / 2 - centerX) / 40;
  const adjustedPosZ = (y + height / 2 - centerY) / 40;
  const sizeX = width / 40;
  const sizeZ = height / 40;
  const isHoriz = width > height;

  const wHeight = wallHeight * 0.55; 
  const wElevation = wallHeight * 0.35 + 0.02; 

  return (
    <group position={[adjustedPosX, wElevation, adjustedPosZ]}>
      {/* Outer framing */}
      <mesh castShadow>
        <boxGeometry args={[isHoriz ? sizeX : 0.08, wHeight, isHoriz ? 0.08 : sizeZ]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      {/* Inner panes structure */}
      <mesh>
        <boxGeometry args={[isHoriz ? sizeX - 0.04 : 0.02, wHeight - 0.04, isHoriz ? 0.02 : sizeZ - 0.04]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} roughness={0.02} metalness={0.98} />
      </mesh>
      {/* Middle thin framing bar */}
      <mesh castShadow>
        <boxGeometry args={[isHoriz ? 0.02 : 0.06, wHeight, isHoriz ? 0.06 : 0.02]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
    </group>
  );
}

function Door3D({ x, y, width, height, centerX, centerY, wallHeight = 0.9 }) {
  const adjustedPosX = (x + width / 2 - centerX) / 40;
  const adjustedPosZ = (y + height / 2 - centerY) / 40;
  const sizeX = width / 40;
  const sizeZ = height / 40;
  const isHoriz = width > height;

  const doorThickness = 0.04;
  const doorHeight = wallHeight * 0.86;

  return (
    <group position={[adjustedPosX, doorHeight / 2 + 0.02, adjustedPosZ]}>
      {/* Door frame jamb */}
      <mesh castShadow>
        <boxGeometry args={[isHoriz ? sizeX : doorThickness + 0.02, doorHeight + 0.04, isHoriz ? doorThickness + 0.02 : sizeZ]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>
      {/* Partially opened door panel (45 degrees tilt) */}
      <group position={[isHoriz ? -sizeX / 2 : 0, 0, isHoriz ? 0 : -sizeZ / 2]} rotation={[0, isHoriz ? Math.PI / 4 : -Math.PI / 4, 0]}>
        <mesh position={[isHoriz ? sizeX / 2 : 0, 0, isHoriz ? 0 : sizeZ / 2]} castShadow>
          <boxGeometry args={[isHoriz ? sizeX - 0.04 : doorThickness, doorHeight, isHoriz ? doorThickness : sizeZ - 0.04]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} /> {/* Wooden leaf */}
        </mesh>
        {/* Shiny brass door handle */}
        <mesh position={[isHoriz ? sizeX - 0.12 : doorThickness * 2, 0.02, isHoriz ? doorThickness * 2 : sizeZ - 0.12]} castShadow>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------
// ROOF BLOCK (IF TOGGLED)
// ---------------------------------------------------------
function FlatRoof({ minX, maxX, minY, maxY, centerX, centerY, isHolo = false }) {
  const w = (maxX - minX) / 40 + 1.8;
  const h = (maxY - minY) / 40 + 1.8;
  const posX = (minX + maxX) / 2 - centerX;
  const posZ = (minY + maxY) / 2 - centerY;

  if (isHolo) {
    return (
      <mesh position={[posX / 40, 1.7, posZ / 40]}>
        <boxGeometry args={[w, 0.08, h]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.4} />
      </mesh>
    );
  }

  return (
    <mesh position={[posX / 40, 1.7, posZ / 40]} castShadow>
      <boxGeometry args={[w, 0.08, h]} />
      <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.1} />
    </mesh>
  );
}

// ---------------------------------------------------------
// FURNITURE SUITE COMPONENT LIBRARY (DETAILED PROCEDURAL)
// ---------------------------------------------------------

function Bed({ isHolo = false, isSunset = false }) {
  if (isHolo) {
    return (
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.5, 0.5, 1.8]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.5} />
      </mesh>
    );
  }
  return (
    <group scale={0.9}>
      {/* Wooden Bed Base */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.16, 2.0]} />
        <meshStandardMaterial color="#5c3f1e" roughness={0.65} />
      </mesh>
      {/* Tall Headboard */}
      <mesh position={[0, 0.46, -0.96]} castShadow>
        <boxGeometry args={[1.7, 0.8, 0.08]} />
        <meshStandardMaterial color="#3f2b15" roughness={0.7} />
      </mesh>
      {/* Mattresses */}
      <mesh position={[-0.38, 0.24, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.18, 1.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.95} />
      </mesh>
      <mesh position={[0.38, 0.24, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.18, 1.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.95} />
      </mesh>
      {/* Angled plump pillows */}
      <group position={[-0.38, 0.36, -0.66]} rotation={[-Math.PI / 12, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.54, 0.08, 0.34]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      </group>
      <group position={[0.38, 0.36, -0.66]} rotation={[-Math.PI / 12, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.54, 0.08, 0.34]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      </group>
      {/* Cozy duvet blanket folded back */}
      <mesh position={[0, 0.35, 0.22]} castShadow>
        <boxGeometry args={[1.6, 0.04, 1.34]} />
        <meshStandardMaterial color="#0284c7" roughness={0.8} /> {/* Indigo blue */}
      </mesh>
      
      {/* Nightstands with active bedside lamps */}
      {[-1.05, 1.05].map((xOffset, idx) => (
        <group key={idx} position={[xOffset, 0, -0.85]}>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.4, 0.38]} />
            <meshStandardMaterial color="#3f2b15" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.44, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
          {/* Glowing lampshade */}
          <mesh position={[0, 0.53, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.11, 0.12, 10]} />
            <meshStandardMaterial color="#ffedd5" emissive="#fbbf24" emissiveIntensity={0.8} />
          </mesh>
          {/* Warm point light glow */}
          <pointLight 
            position={[0, 0.62, 0]} 
            intensity={isSunset ? 1.6 : 1.1} 
            distance={2.4} 
            color="#fbbf24" 
            castShadow 
            shadow-bias={-0.005} 
          />
        </group>
      ))}
    </group>
  );
}

function Sofa({ isHolo = false }) {
  if (isHolo) {
    return (
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[1.8, 0.6, 0.8]} />
        <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.5} />
      </mesh>
    );
  }
  return (
    <group scale={0.92}>
      {/* Cozy L-shape main sofa body */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.16, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} /> {/* Charcoal gray */}
      </mesh>
      {/* Corner segment for L-shape */}
      <mesh position={[0.7, 0.12, 0.68]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.16, 0.56]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>
      {/* Sofa Backrest */}
      <mesh position={[0, 0.46, -0.34]} castShadow>
        <boxGeometry args={[2.2, 0.52, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>
      {/* Separate seat cushion pads */}
      <mesh position={[-0.55, 0.22, 0.03]} castShadow>
        <boxGeometry args={[0.88, 0.08, 0.62]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh position={[0.35, 0.22, 0.03]} castShadow>
        <boxGeometry args={[0.88, 0.08, 0.62]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      <mesh position={[0.7, 0.22, 0.68]} castShadow>
        <boxGeometry args={[0.72, 0.08, 0.5]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      {/* Sleek Armrest */}
      <mesh position={[-1.05, 0.28, 0.01]} castShadow>
        <boxGeometry args={[0.1, 0.36, 0.74]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} />
      </mesh>
      {/* Colorful throw cushions */}
      <group position={[-0.7, 0.32, -0.22]} rotation={[0, 0.2, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.28, 0.08]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.7} /> {/* Cyan pop */}
        </mesh>
      </group>
      <group position={[0.6, 0.32, 0.52]} rotation={[0, -0.3, -0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.28, 0.08]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.7} /> {/* Amber pop */}
        </mesh>
      </group>
    </group>
  );
}

function CoffeeTable() {
  return (
    <group scale={0.85}>
      {/* Sleek metal legs */}
      {[-0.4, 0.4].map((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.11, z]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.22]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
        ))
      )}
      {/* Polished Glass/Marble Top */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.0, 0.02, 0.55]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.1} metalness={0.8} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function TVConsole() {
  return (
    <group scale={0.95}>
      {/* Wood console carcass */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.3, 0.42]} />
        <meshStandardMaterial color="#0f172a" roughness={0.75} />
      </mesh>
      {/* Soundbar */}
      <mesh position={[0, 0.33, 0.06]} castShadow>
        <boxGeometry args={[0.8, 0.04, 0.08]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>
      {/* Thin TV stand */}
      <mesh position={[0, 0.38, -0.08]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Large flat-screen TV panel */}
      <mesh position={[0, 0.72, -0.08]} castShadow>
        <boxGeometry args={[1.3, 0.6, 0.04]} />
        <meshStandardMaterial color="#020617" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Scenic display screen glow */}
      <mesh position={[0, 0.72, -0.058]}>
        <boxGeometry args={[1.26, 0.56, 0.004]} />
        <meshStandardMaterial color="#06b6d4" emissive="#0284c7" emissiveIntensity={1.3} />
      </mesh>
    </group>
  );
}

function DiningTable() {
  return (
    <group scale={0.88}>
      {/* Rich Walnut Tabletop */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.03, 0.85]} />
        <meshStandardMaterial color="#451a03" roughness={0.5} />
      </mesh>
      {/* Modern tapered legs */}
      {[-0.65, 0.65].map((x) =>
        [-0.32, 0.32].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.305, z]} castShadow>
            <cylinderGeometry args={[0.025, 0.015, 0.6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        ))
      )}
      {/* Detailed Dining Chairs */}
      {[
        { x: -0.4, z: 0.52, rot: 0 },
        { x: 0.4, z: 0.52, rot: 0 },
        { x: -0.4, z: -0.52, rot: Math.PI },
        { x: 0.4, z: -0.52, rot: Math.PI }
      ].map((chair, index) => (
        <group key={index} position={[chair.x, 0, chair.z]} rotation={[0, chair.rot, 0]}>
          {/* Chair Seat */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.32, 0.04, 0.32]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, 0.58, 0.14]} castShadow>
            <boxGeometry args={[0.32, 0.48, 0.03]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          {/* Legs */}
          {[-0.13, 0.13].map((cx) =>
            [-0.13, 0.13].map((cz) => (
              <mesh key={`${cx}-${cz}`} position={[cx, 0.16, cz]} castShadow>
                <cylinderGeometry args={[0.012, 0.01, 0.32]} />
                <meshStandardMaterial color="#0f172a" metalness={0.7} />
              </mesh>
            ))
          )}
        </group>
      ))}
    </group>
  );
}

function KitchenSuite({ width = 1.6 }) {
  return (
    <group scale={0.95}>
      {/* Shaker cabinet units */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.84, 0.54]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.55} />
      </mesh>
      {/* Premium Granite slab countertop */}
      <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.02, 0.04, 0.56]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.15} />
      </mesh>
      {/* Inset Stainless steel sink & faucet */}
      <group position={[width * 0.18, 0.88, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.006, 0.32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.08} />
        </mesh>
        {/* Curving faucet neck */}
        <mesh position={[0, 0.14, -0.1]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <group position={[0, 0.22, -0.05]} rotation={[Math.PI / 4, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      </group>
      {/* Electric Cooktop hob */}
      <group position={[-width * 0.2, 0.885, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.006, 0.32]} />
          <meshStandardMaterial color="#090d16" roughness={0.15} />
        </mesh>
        {/* Glowing heating rings */}
        {[-0.09, 0.09].map((x) =>
          [-0.07, 0.07].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.007, z]}>
              <cylinderGeometry args={[0.05, 0.05, 0.001, 16]} />
              <meshStandardMaterial color="#b91c1c" emissive="#ef4444" emissiveIntensity={0.9} />
            </mesh>
          ))
        )}
      </group>
      {/* Stainless steel double-door refrigerator */}
      <group position={[-width / 2 - 0.28, 0, 0]}>
        <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.56, 1.76, 0.56]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Slim handles */}
        <mesh position={[0.29, 1.15, 0.08]} castShadow>
          <boxGeometry args={[0.02, 0.28, 0.03]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        <mesh position={[0.29, 0.55, 0.08]} castShadow>
          <boxGeometry args={[0.02, 0.28, 0.03]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function BathroomSuite() {
  return (
    <group scale={0.92}>
      {/* Oval freestanding Tub */}
      <group position={[-0.55, 0, 0]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.3, 0.44, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </mesh>
        {/* Water disc */}
        <mesh position={[0, 0.41, 0]}>
          <cylinderGeometry args={[0.32, 0.28, 0.01, 24]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.9} transparent opacity={0.7} />
        </mesh>
        {/* Chrome fill spout */}
        <mesh position={[0, 0.48, -0.28]} castShadow>
          <boxGeometry args={[0.03, 0.1, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </mesh>
      </group>
      
      {/* Ceramic Toilet */}
      <group position={[0.55, 0, 0.12]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.11, 0.36, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.37, 0.03]} castShadow>
          <boxGeometry args={[0.28, 0.02, 0.32]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.54, -0.14]} castShadow>
          <boxGeometry args={[0.3, 0.36, 0.15]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </mesh>
        <mesh position={[0.06, 0.73, -0.06]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
        </mesh>
      </group>
      {/* Mirror vanity console */}
      <group position={[0, 0, -0.42]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.76, 0.42]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.77, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.08, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

function BalconySuite({ width = 2.2, depth = 0.9 }) {
  return (
    <group scale={0.95}>
      {/* Balcony Railing: posts + glass screen shield */}
      <group position={[0, 0.4, 0]}>
        {/* Metal top rail */}
        <mesh position={[0, 0.4, depth / 2]} castShadow>
          <boxGeometry args={[width, 0.03, 0.03]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        {/* Transparent glass panel */}
        <mesh position={[0, 0, depth / 2]}>
          <boxGeometry args={[width - 0.06, 0.76, 0.016]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.25} roughness={0.15} />
        </mesh>
        {/* Support rods */}
        {[-width / 2 + 0.04, 0, width / 2 - 0.04].map((x, idx) => (
          <mesh key={idx} position={[x, -0.02, depth / 2]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.8, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        ))}
      </group>
      {/* Two woven rattan armchairs */}
      <group position={[-width * 0.22, 0.01, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.44, 0.32, 0.44]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.33, 0]} castShadow>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      </group>
      <group position={[width * 0.22, 0.01, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.44, 0.32, 0.44]} />
          <meshStandardMaterial color="#b45309" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.33, 0]} castShadow>
          <boxGeometry args={[0.4, 0.04, 0.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function PoolTable() {
  return (
    <group scale={0.9}>
      {/* Tapered wooden posts */}
      {[-0.55, 0.55].map((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.32, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.03, 0.64]} />
            <meshStandardMaterial color="#451a03" roughness={0.7} />
          </mesh>
        ))
      )}
      {/* Solid wood table base */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[1.3, 0.08, 0.8]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      {/* Green felt playing canvas */}
      <mesh position={[0, 0.721, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.01, 0.7]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
    </group>
  );
}

function PottedPlant({ position }) {
  return (
    <group position={position} scale={0.85}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.05, 0.2, 12]} />
        <meshStandardMaterial color="#c2410c" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#166534" roughness={0.9} />
      </mesh>
      <mesh position={[0.06, 0.36, -0.06]} castShadow>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SwimmingPool({ position }) {
  return (
    <group position={position} scale={0.95}>
      {/* Concrete deck surrounding */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[4.2, 0.01, 6.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      {/* Deep blue pool water layer */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[3.8, 0.012, 5.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.04} metalness={0.95} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------
// ROOM FLOOR & FURNITURE LAYOUT CONTROLLER
// ---------------------------------------------------------
function RoomFloor({ room, centerX, centerY, selectedRoomId, theme, roomCustomizations = {}, isHolo = false }) {
  const roomCenterX = (room.x + room.width / 2 - centerX) / 40;
  const roomCenterZ = (room.y + room.height / 2 - centerY) / 40;
  const sizeX = room.width / 40;
  const sizeZ = room.height / 40;

  const isSelected = room.id === selectedRoomId;
  const roomCust = roomCustomizations[room.id] || {};
  const activeFloorType = roomCust.floorType;

  // Custom canvas textures generated procedurally for maximum realism
  const floorTextures = useMemo(() => {
    // 1. Beautiful Wood Parquet Planks
    const c1 = document.createElement("canvas");
    c1.width = 512; c1.height = 512;
    const ctx1 = c1.getContext("2d");
    const plankH = 32;
    // Base colors
    ctx1.fillStyle = "#855827";
    ctx1.fillRect(0, 0, 512, 512);
    // Draw wood blocks with slight color variance
    for (let y = 0; y <= 512; y += plankH) {
      const shift = (y / plankH) % 2 === 0 ? 0 : 64;
      for (let x = -shift; x <= 512 + 64; x += 128) {
        ctx1.fillStyle = ["#855827", "#8e5e2b", "#7b5022", "#94632e"][(Math.floor(x + y)) % 4];
        ctx1.fillRect(x, y, 128, plankH);
        ctx1.strokeStyle = "#4d3012";
        ctx1.lineWidth = 1.5;
        ctx1.strokeRect(x, y, 128, plankH);
      }
    }
    const tWood = new THREE.CanvasTexture(c1);
    tWood.wrapS = THREE.RepeatWrapping; tWood.wrapT = THREE.RepeatWrapping;
    tWood.repeat.set(1.8, 1.8);

    // 2. Glossy Grey Veined Marble
    const c2 = document.createElement("canvas");
    c2.width = 512; c2.height = 512;
    const ctx2 = c2.getContext("2d");
    ctx2.fillStyle = "#f8fafc";
    ctx2.fillRect(0, 0, 512, 512);
    ctx2.strokeStyle = "rgba(100, 116, 139, 0.15)";
    ctx2.lineWidth = 2.0;
    // Draw veins
    for (let i = 0; i < 15; i++) {
      ctx2.beginPath();
      let cx = Math.random() * 512;
      let cy = 0;
      ctx2.moveTo(cx, cy);
      while (cy < 512) {
        cx += (Math.random() - 0.5) * 24;
        cy += Math.random() * 50 + 10;
        ctx2.lineTo(cx, cy);
      }
      ctx2.stroke();
    }
    const tMarble = new THREE.CanvasTexture(c2);
    tMarble.wrapS = THREE.RepeatWrapping; tMarble.wrapT = THREE.RepeatWrapping;
    tMarble.repeat.set(1.5, 1.5);

    // 3. Bathroom Ceramic Hexagon Tiles
    const c3 = document.createElement("canvas");
    c3.width = 128; c3.height = 128;
    const ctx3 = c3.getContext("2d");
    ctx3.fillStyle = "#1e293b"; // Slate Hex
    ctx3.fillRect(0, 0, 128, 128);
    ctx3.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx3.lineWidth = 1.2;
    const hexSize = 10;
    const drawHex = (x, y, r) => {
      ctx3.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        ctx3.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx3.closePath();
      ctx3.fill();
      ctx3.stroke();
    };
    for (let y = 0; y < 128 + hexSize; y += hexSize * 1.5) {
      ctx3.fillStyle = ["#1e293b", "#0f172a", "#334155"][(Math.floor(y)) % 3];
      const offset = (Math.floor(y / (hexSize * 1.5)) % 2 === 0) ? 0 : hexSize * Math.sqrt(3) / 2;
      for (let x = -hexSize; x < 128 + hexSize * 2; x += hexSize * Math.sqrt(3)) {
        drawHex(x + offset, y, hexSize - 1.2);
      }
    }
    const tTiles = new THREE.CanvasTexture(c3);
    tTiles.wrapS = THREE.RepeatWrapping; tTiles.wrapT = THREE.RepeatWrapping;
    tTiles.repeat.set(4, 4);

    // 4. Balcony Stone Pavers
    const c4 = document.createElement("canvas");
    c4.width = 256; c4.height = 256;
    const ctx4 = c4.getContext("2d");
    ctx4.fillStyle = "#cbd5e1"; // Slate concrete tiles
    ctx4.fillRect(0, 0, 256, 256);
    ctx4.strokeStyle = "#475569";
    ctx4.lineWidth = 4;
    ctx4.strokeRect(0, 0, 256, 256);
    ctx4.beginPath();
    ctx4.moveTo(128, 0); ctx4.lineTo(128, 256);
    ctx4.moveTo(0, 128); ctx4.lineTo(256, 128);
    ctx4.stroke();
    const tPavers = new THREE.CanvasTexture(c4);
    tPavers.wrapS = THREE.RepeatWrapping; tPavers.wrapT = THREE.RepeatWrapping;
    tPavers.repeat.set(3, 3);

    return { tWood, tMarble, tTiles, tPavers };
  }, []);

  if (isHolo) {
    return (
      <mesh position={[roomCenterX, 0.025, roomCenterZ]}>
        <boxGeometry args={[sizeX - 0.04, 0.01, sizeZ - 0.04]} />
        <meshBasicMaterial 
          color="#06b6d4" 
          wireframe 
          transparent 
          opacity={isSelected ? 0.6 : 0.2} 
        />
      </mesh>
    );
  }

  // Choose flooring material based on room type / user customization override
  let floorMaterial;
  if (theme === "blueprint") {
    floorMaterial = (
      <meshStandardMaterial 
        color={isSelected ? "#1e40af" : "#1d4ed8"} 
        roughness={0.9} 
        transparent 
        opacity={0.35} 
      />
    );
  } else {
    const finalFloorType = activeFloorType || (
      room.type === "Living Room" || room.type.includes("Bedroom") ? "wood" : 
      room.type.includes("Kitchen") ? "marble" : 
      room.type.includes("Bathroom") ? "tiles" : 
      room.type.includes("Balcony") ? "pavers" : "wood"
    );

    if (finalFloorType === "wood") {
      floorMaterial = <meshStandardMaterial map={floorTextures.tWood} roughness={0.38} metalness={0.06} />;
    } else if (finalFloorType === "marble") {
      floorMaterial = <meshStandardMaterial map={floorTextures.tMarble} roughness={0.16} metalness={0.08} />;
    } else if (finalFloorType === "tiles") {
      floorMaterial = <meshStandardMaterial map={floorTextures.tTiles} roughness={0.5} />;
    } else if (finalFloorType === "pavers") {
      floorMaterial = <meshStandardMaterial map={floorTextures.tPavers} roughness={0.65} />;
    } else {
      // Carpet (Solid clean cream look with high roughness)
      floorMaterial = <meshStandardMaterial color={isSelected ? "#e2e8f0" : "#f1f5f9"} roughness={0.96} />;
    }
  }

  // Render appropriate furniture layout inside the room boundary
  const renderFurniture = () => {
    if (theme === "blueprint" || isHolo) return null;

    // Boundary limits for furniture placement
    const canFitL = sizeX > 1.3 && sizeZ > 1.3;
    if (!canFitL) return null;

    const isSunset = theme === "sunset";

    switch (room.type) {
      case "Living Room":
        return (
          <group>
            {/* Main cozy fabric rug */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[sizeX * 0.74, sizeZ * 0.7]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.98} />
            </mesh>
            <Sofa position={[0, 0.01, sizeZ * 0.12]} />
            <TVConsole position={[0, 0.01, -sizeZ * 0.22]} />
            <CoffeeTable position={[0, 0.01, -0.06]} />
            <PottedPlant position={[sizeX * 0.36, 0.01, -sizeZ * 0.34]} />
            <PottedPlant position={[-sizeX * 0.36, 0.01, sizeZ * 0.34]} />
          </group>
        );
      case "Master Bedroom":
        return (
          <group>
            <Bed position={[0, 0.01, -sizeZ * 0.1]} isSunset={isSunset} />
            {sizeX > 2.0 && (
              <group position={[sizeX * 0.34, 0, sizeZ * 0.24]}>
                {/* Vanity dressing table */}
                <mesh position={[0, 0.32, 0]} castShadow>
                  <boxGeometry args={[0.74, 0.03, 0.4]} />
                  <meshStandardMaterial color="#451a03" />
                </mesh>
                <mesh position={[0, 0.16, 0]}>
                  <boxGeometry args={[0.62, 0.32, 0.32]} />
                  <meshStandardMaterial color="#cbd5e1" />
                </mesh>
              </group>
            )}
            <PottedPlant position={[-sizeX * 0.35, 0.01, sizeZ * 0.3]} />
          </group>
        );
      case "Bedroom 2":
        return (
          <group>
            <group scale={0.88} position={[0, 0, -sizeZ * 0.08]}>
              <Bed isSunset={isSunset} />
            </group>
            <PottedPlant position={[sizeX * 0.32, 0.01, sizeZ * 0.3]} />
          </group>
        );
      case "Kitchen & Dining":
        return (
          <group>
            <KitchenSuite position={[-sizeX * 0.08, 0, -sizeZ * 0.24]} width={sizeX * 0.6} />
            <DiningTable position={[0, 0, sizeZ * 0.18]} />
          </group>
        );
      case "Bathroom":
      case "Guest Bathroom":
        return (
          <group>
            <BathroomSuite />
          </group>
        );
      case "Study / Recreation":
      case "Study":
        return (
          <group>
            <PoolTable position={[0, 0, 0]} />
            <PottedPlant position={[sizeX * 0.35, 0.01, -sizeZ * 0.35]} />
          </group>
        );
      case "Balcony Suite":
        return (
          <group>
            <BalconySuite width={sizeX} depth={sizeZ} />
          </group>
        );
      default:
        return null;
    }
  };

  return (
    <group>
      {/* Floor Slab */}
      <mesh position={[roomCenterX, 0.01, roomCenterZ]} receiveShadow castShadow>
        <boxGeometry args={[sizeX - 0.02, 0.008, sizeZ - 0.02]} />
        {floorMaterial}
      </mesh>

      {/* Selected room glowing border indicator */}
      {isSelected && (
        <mesh position={[roomCenterX, 0.015, roomCenterZ]}>
          <boxGeometry args={[sizeX - 0.005, 0.012, sizeZ - 0.005]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.7} />
        </mesh>
      )}

      {/* Render local furniture placement */}
      <group position={[roomCenterX, 0.014, roomCenterZ]}>
        {renderFurniture()}
      </group>
    </group>
  );
}

// ---------------------------------------------------------
// MAIN VIEWPORT COMPONENT
// ---------------------------------------------------------
export default function Viewer3D({ 
  walls = [], 
  rooms = [], 
  showRoof = false, 
  selectedRoomId = null, 
  theme = "daylight", 
  viewMode = "angled",
  roomCustomizations = {},
  globalSettings = {}
}) {
  const hasWalls = walls && walls.length > 0;
  const controlsRef = useRef();

  // 1. Gather Doors and Windows based on collinear wall gaps
  const { doors, windows } = useMemo(() => {
    return detectOpenings(walls);
  }, [walls]);

  // Adjust properties based on global settings sliders
  const wallHeightVal = globalSettings.wallHeight || 0.9;
  const globalWallColor = globalSettings.wallColor || "#f8fafc";
  const sunBrightness = globalSettings.sunBrightness !== undefined ? globalSettings.sunBrightness : 3.0;
  const sunAngle = globalSettings.sunAngle !== undefined ? globalSettings.sunAngle : 0; // in radians

  // Bounding box of walls
  const minX = hasWalls ? Math.min(...walls.map(w => w.x)) : 50;
  const maxX = hasWalls ? Math.max(...walls.map(w => w.x + w.width)) : 350;
  const minY = hasWalls ? Math.min(...walls.map(w => w.y)) : 50;
  const maxY = hasWalls ? Math.max(...walls.map(w => w.y + w.height)) : 340;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const hW = (maxX - minX) / 40;
  const hD = (maxY - minY) / 40;
  const maxDimension = Math.max(hW, hD, 1);
  const cameraDistance = Math.max(maxDimension * 1.5, 14);

  const isHolo = theme === "holo";
  const isBlue = theme === "blueprint";
  const isDaylight = theme === "daylight";
  const isSunset = theme === "sunset";

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  // Orbit controls position update based on focused state / camera modes
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const tY = 0.25;

      if (selectedRoom) {
        const roomCenterX = (selectedRoom.x + selectedRoom.width / 2 - centerX) / 40;
        const roomCenterZ = (selectedRoom.y + selectedRoom.height / 2 - centerY) / 40;
        
        controls.target.set(roomCenterX, tY, roomCenterZ);
        controls.object.position.set(roomCenterX + 3.2, 3.2, roomCenterZ + 3.2);
      } else {
        if (viewMode === "front") {
          controls.object.position.set(0, cameraDistance * 0.28, cameraDistance * 1.15);
          controls.target.set(0, tY, 0);
        } else if (viewMode === "top") {
          controls.object.position.set(0, cameraDistance * 1.35, 0.01);
          controls.target.set(0, 0, 0);
        } else if (viewMode === "angled") {
          controls.object.position.set(cameraDistance * 0.72, cameraDistance * 0.72, cameraDistance * 0.72);
          controls.target.set(0, tY, 0);
        }
      }
      controls.update();
    }
  }, [viewMode, cameraDistance, selectedRoom, centerX, centerY]);

  // Compute direction position based on sunAngle slider input
  const sunPosition = useMemo(() => {
    const radius = 35;
    const x = radius * Math.cos(sunAngle);
    const z = radius * Math.sin(sunAngle);
    return [x, 30, z];
  }, [sunAngle]);

  const containerBg = isHolo 
    ? "radial-gradient(circle at center, #020617 0%, #090d16 100%)"
    : isBlue
      ? "radial-gradient(circle at center, #070e1b 0%, #03060c 100%)"
      : isDaylight
        ? "radial-gradient(circle at center, #f8fafc 0%, #cbd5e1 100%)"
        : "radial-gradient(circle at center, #1b0c2c 0%, #02040b 100%)"; // sunset

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        background: containerBg,
        transition: "background 0.5s ease",
        overflow: "hidden"
      }}
    >
      <Canvas 
        shadows 
        camera={{ position: [cameraDistance * 0.72, cameraDistance * 0.72, cameraDistance * 0.72], fov: 40 }}
      >
        {/* Soft shadow map configurations */}
        {isHolo ? (
          <>
            <ambientLight intensity={0.95} color="#0891b2" />
            <directionalLight position={[10, 20, 10]} intensity={1.5} color="#06b6d4" />
          </>
        ) : isBlue ? (
          <>
            <ambientLight intensity={1.1} color="#38bdf8" />
            <directionalLight position={[10, 20, 10]} intensity={1.8} color="#0284c7" />
          </>
        ) : isDaylight ? (
          <>
            <ambientLight intensity={1.0} color="#ffffff" />
            <directionalLight 
              position={sunPosition} 
              intensity={sunBrightness} 
              color="#fffcf0" 
              castShadow
              shadow-mapSize-width={4096} 
              shadow-mapSize-height={4096}
              shadow-bias={-0.0003}
              shadow-camera-far={80}
              shadow-camera-left={-20}
              shadow-camera-right={20}
              shadow-camera-top={20}
              shadow-camera-bottom={-20}
            />
            <directionalLight position={[-15, 10, -15]} intensity={0.4} color="#e2e8f0" />
          </>
        ) : (
          /* Rich Photo Sunset */
          <>
            <ambientLight intensity={0.5} color="#93c5fd" />
            <directionalLight 
              position={sunPosition} 
              intensity={sunBrightness + 0.5} 
              color="#ff8c52" // Deep orange setting sun
              castShadow 
              shadow-mapSize-width={4096} 
              shadow-mapSize-height={4096}
              shadow-bias={-0.0003}
              shadow-camera-far={80}
              shadow-camera-left={-20}
              shadow-camera-right={20}
              shadow-camera-top={20}
              shadow-camera-bottom={-20}
            />
            <directionalLight position={[-15, 8, -15]} intensity={0.35} color="#4f46e5" /> {/* Blue sky ambient bounce */}
          </>
        )}

        {/* 1. Ground drafting paper helper */}
        <BlueprintGrid isBlue={isBlue || isHolo} />

        {/* 2. Concrete slab foundation */}
        {hasWalls && (
          <HouseFoundation 
            minX={minX} 
            maxX={maxX} 
            minY={minY} 
            maxY={maxY} 
            centerX={centerX} 
            centerY={centerY} 
            isHolo={isHolo || isBlue}
          />
        )}

        {/* 3. Rooms Floor with Furniture and custom tiles */}
        {hasWalls && rooms.map((room) => (
          <RoomFloor
            key={room.id}
            room={room}
            centerX={centerX}
            centerY={centerY}
            selectedRoomId={selectedRoomId}
            theme={theme}
            roomCustomizations={roomCustomizations}
            isHolo={isHolo}
          />
        ))}

        {/* 4. Realistic 3D Wall segments */}
        {hasWalls && walls.map((wall, index) => (
          <Wall
            key={`wall-${index}`}
            x={wall.x}
            y={wall.y}
            width={wall.width}
            height={wall.height}
            centerX={centerX}
            centerY={centerY}
            wallHeight={showRoof ? wallHeightVal * 1.8 : wallHeightVal} 
            wallColor={globalWallColor}
            isHolo={isHolo || isBlue}
          />
        ))}

        {/* 5. Draw windows in collinear exterior gaps */}
        {hasWalls && !isHolo && !isBlue && windows.map((win, idx) => (
          <Window3D
            key={`win-${idx}`}
            x={win.x}
            y={win.y}
            width={win.width}
            height={win.height}
            centerX={centerX}
            centerY={centerY}
            wallHeight={showRoof ? wallHeightVal * 1.8 : wallHeightVal}
          />
        ))}

        {/* 6. Draw doors in collinear interior gaps */}
        {hasWalls && !isHolo && !isBlue && doors.map((dr, idx) => (
          <Door3D
            key={`door-${idx}`}
            x={dr.x}
            y={dr.y}
            width={dr.width}
            height={dr.height}
            centerX={centerX}
            centerY={centerY}
            wallHeight={showRoof ? wallHeightVal * 1.8 : wallHeightVal}
          />
        ))}

        {/* 7. Flat Roof overlay structure */}
        {hasWalls && showRoof && (
          <FlatRoof 
            minX={minX} 
            maxX={maxX} 
            minY={minY} 
            maxY={maxY} 
            centerX={centerX} 
            centerY={centerY} 
            isHolo={isHolo || isBlue}
          />
        )}

        {/* 8. Swimming Pool landscape */}
        {hasWalls && !isHolo && !isBlue && (
          <SwimmingPool position={[hW / 2 + 3.2, 0.015, 0]} />
        )}

        <OrbitControls 
          ref={controlsRef}
          enableDamping 
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2 - 0.05} 
          minDistance={3}
          maxDistance={50}
          target={[0, 0.2, 0]}
        />
      </Canvas>
    </div>
  );
}
