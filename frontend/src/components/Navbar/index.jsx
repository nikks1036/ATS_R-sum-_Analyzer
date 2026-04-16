// // import { Navigate } from "react-router-dom";

// // const ProtectedRoute = ({ children }) => {
// //   const token = localStorage.getItem("token");

// //   if (!token) {
// //     return <Navigate to="/login" replace />;
// //   }

// //   return children;
// // };

// // export default ProtectedRoute;
// // ...existing code...
// import { useNavigate } from "react-router-dom";
// import "./index.css";

// const Navbar = () => {
//   const navigate = useNavigate();
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     navigate("/login");
//   };

//   return (
//     <div className="navbar">
//       <div>Resume ATS Analyzer</div>
//       <div>
//         <button onClick={() => navigate("/dashboard")}>Dashboard</button>
//         <button onClick={handleLogout}>Logout</button>
//       </div>
//     </div>
//   );
// };

// export default Navbar;
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./index.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("token"));
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

    const onStorage = () => syncAuth();
    const onAuthChanged = () => syncAuth();

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth-changed", onAuthChanged);
    syncAuth();

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchMe = async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          setUser(data.user);
        }
      } catch {
        // fail silently; we still have local user data fallback
      }
    };

    fetchMe();
  }, [token]);

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
      <div className="navbar-logo" onClick={() => navigate("/")}>
        ✦ ResumeATS
      </div>

      <div className="navbar-links">
        {links.map((link) => (
          <button
            key={link.path}
            className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="navbar-actions">
        {token ? (
          <>
            <div className="account-chip" title={user?.email || "Logged in user"}>
              <span className="account-name">{user?.name || "My Account"}</span>
              <span className="account-email">{user?.email || "Signed in"}</span>
            </div>
            <button className="nav-btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="nav-btn-ghost" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="nav-btn-primary" onClick={() => navigate("/register")}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
