import { useState } from "react";
import { FiHexagon } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import "../styles/AdminLogin.css";

function AdminLogin({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);

    // Premium quick mock authentication sequence
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 800);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-grid-bg"></div>
      
      <div className="login-card-container">
        <div className="login-logo-section">
          <FiHexagon className="login-logo-icon" />
          <h1>Blueprint<span>3D</span></h1>
          <span className="login-subtitle">SECURE ADMIN PORTAL</span>
        </div>

        <div className="google-signin-wrapper">
          <p className="login-instruction">
            Access the 3D converter environment via secure single sign-on.
          </p>

          <button
            onClick={handleGoogleSignIn}
            className={`google-login-btn ${isLoading ? "btn-loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="tech-spinner">Authenticating...</span>
            ) : (
              <>
                <FcGoogle className="google-icon" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="login-footer">
          <span>Security Level: Tier-3 Google CAD Auth</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
