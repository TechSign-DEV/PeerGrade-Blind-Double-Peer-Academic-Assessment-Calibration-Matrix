
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import api from "../services/api";
import Sidebar from "./Sidebar";
import "./AppLayout.css";

export default function AppLayout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await api.get("/auth/me");

        if (active) {
          const currentUser = response.data.user;
          setUser(currentUser);
          localStorage.setItem(
            "peergrade_user",
            JSON.stringify(currentUser)
          );
        }
      } catch {
        if (active) setUnauthorized(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="app-layout-loading">Loading PeerGrade...</div>;
  }

  if (unauthorized || !user) {
    localStorage.removeItem("peergrade_token");
    localStorage.removeItem("peergrade_user");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      {/* Dashboard already has its own sidebar. */}
      {location.pathname !== "/dashboard" && (
        <Sidebar user={user} />
      )}

      <div className="app-layout-content">
        <Outlet />
      </div>
    </div>
  );
}
