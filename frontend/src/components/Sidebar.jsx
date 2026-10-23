
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const menus = {
  STUDENT: [
    { label: "Dashboard", path: "/dashboard", icon: "⌂" },
    { label: "Assignments", path: "/assignments", icon: "▤" },
    { label: "Peer Reviews", path: "/peer-reviews", icon: "✎" },
    { label: "My Results", path: "/results", icon: "▥" },
  ],
  INSTRUCTOR: [
    { label: "Dashboard", path: "/dashboard", icon: "⌂" },
    { label: "Create Assignment", path: "/assignments/create", icon: "+" },
    { label: "Calibration", path: "/calibration", icon: "◎" },
    { label: "Grade Management", path: "/instructor/grades", icon: "▥" },
  ],
  ADMIN: [
    { label: "Dashboard", path: "/dashboard", icon: "⌂" },
    { label: "Admin Panel", path: "/admin", icon: "⚙" },
  ],
};

export default function Sidebar({ user }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("peergrade_token");
    localStorage.removeItem("peergrade_user");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="app-sidebar">
      <button
        className="sidebar-brand"
        onClick={() => navigate("/dashboard")}
      >
        <span className="sidebar-logo">P</span>
        <span>
          <strong>PeerGrade</strong>
          <small>Academic Assessment</small>
        </span>
      </button>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav">
        {(menus[user?.role] || []).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "selected" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <span className="sidebar-avatar">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </span>
          <div className="sidebar-user-info">
            <strong>{user?.name || "User"}</strong>
            <small>{user?.role || "Account"}</small>
          </div>
        </div>

        <button className="sidebar-logout" onClick={logout}>
          ↪ Sign out
        </button>
      </div>
    </aside>
  );
}
