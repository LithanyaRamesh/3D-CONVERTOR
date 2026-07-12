import { useState } from "react";
import "../styles/Hero.css";
import UploadCard from "./UploadCard";

function Hero() {
  const [hasWalls, setHasWalls] = useState(false);

  return (
    <div className={`hero-page-root ${hasWalls ? "workspace-view-active" : "landing-view-active"}`}>
      {!hasWalls && (
        <section className="hero">
          <div className="hero-content">
            <span className="badge">AI POWERED</span>
            <h1>
              AI <span>2D → 3D</span>
              <br />
              Blueprint Converter
            </h1>
            <p>
              Upload your 2D blueprint and convert it into a realistic interactive
              3D model within seconds using Artificial Intelligence.
            </p>
          </div>
        </section>
      )}

      <div className={hasWalls ? "full-workspace-wrapper" : "upload-card-wrapper"}>
        <UploadCard onWallsChange={setHasWalls} />
      </div>
    </div>
  );
}

export default Hero;
