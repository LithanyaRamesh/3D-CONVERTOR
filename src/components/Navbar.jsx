import { FiHexagon, FiUpload, FiBox, FiFolder, FiPlus } from "react-icons/fi";
import "../styles/Navbar.css";

function Navbar({ activeTab, setActiveTab, onNewConversion, onLogout }) {
  return (
    <header className="navbar-container">
      <div className="navbar-logo" onClick={onNewConversion}>
        <FiHexagon className="logo-icon" />
        <h2>Blueprint<span>3D</span></h2>
      </div>

      <nav className="navbar-nav">
        <button 
          className={`nav-tab ${activeTab === "convert" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("convert")}
        >
          <FiUpload className="tab-icon" />
          <span>Convert</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === "viewer" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("viewer")}
        >
          <FiBox className="tab-icon" />
          <span>3D Viewer</span>
        </button>

        <button 
          className={`nav-tab ${activeTab === "projects" ? "active-tab" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <FiFolder className="tab-icon" />
          <span>Projects</span>
        </button>
      </nav>

      <div className="navbar-right">
        <button className="new-conversion-btn" onClick={onNewConversion}>
          <FiPlus className="plus-icon" />
          <span>New Conversion</span>
        </button>
        
        <div className="user-profile" title="Admin User" onClick={onLogout}>
          MK
        </div>
      </div>
    </header>
  );
}

export default Navbar;
