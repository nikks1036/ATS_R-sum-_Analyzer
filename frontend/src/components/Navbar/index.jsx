import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./index.css";

const API_BASE = "https://ats-r-sum-analyzer.onrender.com";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const links = [
    { label: "Home", path: "/" },
    { label: "Your Resumes", path: "/your-resumes" },
    { label: "Contact", path: "/contact" },
  ];

  // 🔁 Sync auth across tabs & events
  useEffect(() => {
    const syncAuth = () => {
      const nextToken = localStorage.getItem("token");
      setToken(nextToken);

      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    syncAuth();

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  // 🔐 Fetch user info using token
  useEffect(() => {
    if (!token) return;

    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // ❌ Token invalid → logout
          handleLogout();
          return;
        }

        const data = await response.json();

        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch (err) {
        console.log("Fetch user failed:", err.message);
      }
    };

    fetchMe();
  }, [token]);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo" onClick={() => navigate("/")}>
        ✦ ResumeATS
      </div>

      {/* Links */}
      <div className="navbar-links">
        {links.map((link) => (
          <button
            key={link.path}
            className={`nav-link ${
              location.pathname === link.path ? "active" : ""
            }`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Auth Section */}
      <div className="navbar-actions">
        {token ? (
          <>
            <div className="account-chip">
              <span className="account-name">
                {user?.name || "My Account"}
              </span>
              <span className="account-email">
                {user?.email || "Logged in"}
              </span>
            </div>

            <button className="nav-btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="nav-btn-ghost"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              className="nav-btn-primary"
              onClick={() => navigate("/register")}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
