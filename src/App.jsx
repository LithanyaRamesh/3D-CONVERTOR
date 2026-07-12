import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AdminLogin from "./components/AdminLogin";
import UploadCard from "./components/UploadCard";
import Viewer3D from "./components/Viewer3D";
import { getDemoBlueprintWalls, analyzeRooms } from "./utils/blueprintProcessor";
import { FiGrid, FiEye, FiFolder, FiClock } from "react-icons/fi";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState("convert");
  const [sessionResetTrigger, setSessionResetTrigger] = useState(0);

  // Shared state for current conversion
  const [currentWalls, setCurrentWalls] = useState([]);
  const [currentFileName, setCurrentFileName] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  // Sync login status locally if needed
  useEffect(() => {
    const auth = localStorage.getItem("bp3d_admin_auth");
    if (auth === "true") {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    localStorage.setItem("bp3d_admin_auth", "true");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("bp3d_admin_auth");
  };

  const handleNewConversion = () => {
    setActiveTab("convert");
    setSessionResetTrigger(prev => prev + 1);
  };

  const handleLoadProject = (walls, filename, imgUrl) => {
    setCurrentWalls(walls);
    setCurrentFileName(filename);
    setCurrentImageUrl(imgUrl);
    setActiveTab("convert");
  };

  // Mock projects list data
  const mockProjects = [
    {
      id: "proj-1",
      name: "Modern 3-Bedroom Villa",
      filename: "villa_ground_floor.png",
      area: 142,
      rooms: 7,
      date: "2026-07-08",
      walls: getDemoBlueprintWalls()
    },
    {
      id: "proj-2",
      name: "Luxury Penthouse Suite",
      filename: "penthouse_layout_v3.jpg",
      area: 210,
      rooms: 9,
      date: "2026-07-05",
      walls: [
        { x: 30, y: 30, width: 340, height: 10 },
        { x: 30, y: 360, width: 340, height: 10 },
        { x: 30, y: 30, width: 10, height: 340 },
        { x: 360, y: 30, width: 10, height: 340 },
        { x: 190, y: 30, width: 10, height: 340 },
        { x: 30, y: 190, width: 340, height: 10 }
      ]
    },
    {
      id: "proj-3",
      name: "Studio Apartment A",
      filename: "studio_flat.png",
      area: 65,
      rooms: 3,
      date: "2026-07-01",
      walls: [
        { x: 80, y: 80, width: 240, height: 10 },
        { x: 80, y: 320, width: 240, height: 10 },
        { x: 80, y: 80, width: 10, height: 250 },
        { x: 310, y: 80, width: 10, height: 250 },
        { x: 80, y: 200, width: 140, height: 10 },
        { x: 210, y: 80, width: 10, height: 130 }
      ]
    }
  ];



  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", backgroundColor: "#020617" }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onNewConversion={handleNewConversion}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* TAB 1: CONVERT (Contains the main upload -> pipeline -> workspace flow) */}
        {activeTab === "convert" && (
          <UploadCard 
            key={`upload-card-session-${sessionResetTrigger}`}
            initialWalls={currentWalls}
            initialFileName={currentFileName}
            initialImageUrl={currentImageUrl}
            onSaveState={(walls, filename, imgUrl) => {
              setCurrentWalls(walls);
              setCurrentFileName(filename);
              setCurrentImageUrl(imgUrl);
            }}
          />
        )}

        {/* TAB 2: 3D VIEWER (Loads Three.js sandbox viewport directly) */}
        {activeTab === "viewer" && (
          <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Viewer3D 
              walls={currentWalls.length > 0 ? currentWalls : getDemoBlueprintWalls()}
              rooms={analyzeRooms(currentWalls.length > 0 ? currentWalls : getDemoBlueprintWalls())}
              showRoof={false}
              theme="daylight"
              viewMode="angled"
            />
            
            {/* Quick dashboard Overlay in Direct Viewer Mode */}
            <div style={{
              position: "absolute",
              top: "24px",
              left: "24px",
              background: "rgba(10, 15, 30, 0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "12px",
              padding: "16px 20px",
              color: "white",
              textAlign: "left",
              pointerEvents: "none"
            }}>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "8px" }}>
                <FiEye /> Direct View Sandbox
              </h4>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Loaded Structure: {currentFileName || "demo_apartment_schematic.dxf"}
              </span>
              <div style={{ marginTop: "12px", display: "flex", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>NODES</span>
                  <span style={{ fontSize: "13px", fontWeight: "bold" }}>{(currentWalls.length > 0 ? currentWalls : getDemoBlueprintWalls()).length} segments</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>ROOMS</span>
                  <span style={{ fontSize: "13px", fontWeight: "bold" }}>{analyzeRooms(currentWalls.length > 0 ? currentWalls : getDemoBlueprintWalls()).length} zones</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROJECTS (List of historical or sample schematics) */}
        {activeTab === "projects" && (
          <div style={{ 
            height: "100%", 
            overflowY: "auto", 
            padding: "40px 8%", 
            boxSizing: "border-box", 
            background: "radial-gradient(circle at center, #090f22 0%, #020617 100%)",
            color: "white"
          }}>
            <div style={{ textAlign: "left", marginBottom: "35px" }}>
              <h2 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>Saved Blueprints & Models</h2>
              <p style={{ color: "#94a3b8", fontSize: "15px", marginTop: "6px" }}>Load an existing layout into the 3D extrusion workspace or test pre-computed schematics.</p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px"
            }}>
              {mockProjects.map(proj => (
                <div 
                  key={proj.id}
                  style={{
                    background: "rgba(13, 20, 38, 0.5)",
                    border: "1px solid rgba(56, 189, 248, 0.15)",
                    borderRadius: "16px",
                    padding: "24px",
                    textAlign: "left",
                    transition: "all 0.3s",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.45)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(14, 165, 233, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.15)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  onClick={() => handleLoadProject(proj.walls, proj.filename, "demo")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <span style={{
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: "#818cf8",
                      fontWeight: 600
                    }}>
                      PROJECT
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FiClock /> {proj.date}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#f8fafc" }}>{proj.name}</h3>
                  <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>{proj.filename}</span>

                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "12px", 
                    margin: "24px 0 0 0",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    paddingTop: "16px"
                  }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Surface Area</span>
                      <div style={{ fontSize: "15px", fontWeight: "bold", color: "#0ea5e9" }}>{proj.area} m²</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase" }}>Mesh Zones</span>
                      <div style={{ fontSize: "15px", fontWeight: "bold", color: "#10b981" }}>{proj.rooms} Rooms</div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#0ea5e9",
                    fontSize: "13px",
                    fontWeight: 600
                  }}>
                    <FiFolder /> Open in CAD Editor
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
