
import { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

const navigation = {
  STUDENT: [
    { label: "Overview", path: "/dashboard", icon: "⌂" },
    { label: "Assignments", path: "/assignments", icon: "▤" },
    { label: "Peer Reviews", path: "/peer-reviews", icon: "✎" },
    { label: "My Results", path: "/results", icon: "▥" },
  ],
  INSTRUCTOR: [
    { label: "Overview", path: "/dashboard", icon: "⌂" },
    { label: "Create Assignment", path: "/assignments/create", icon: "+" },
    { label: "Calibration", path: "/calibration", icon: "◎" },
    { label: "Grade Management", path: "/instructor/grades", icon: "▥" },
  ],
  ADMIN: [
    { label: "Overview", path: "/dashboard", icon: "⌂" },
    { label: "Admin Panel", path: "/admin", icon: "⚙" },
  ],
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [allocatingId, setAllocatingId] = useState("");
  const [allocationResults, setAllocationResults] = useState({});

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const response = await api.get("/auth/me");
        const currentUser = response.data.user;

        if (mounted) {
          setUser(currentUser);
          localStorage.setItem(
            "peergrade_user",
            JSON.stringify(currentUser)
          );
        }
      } catch {
        localStorage.removeItem("peergrade_token");
        localStorage.removeItem("peergrade_user");
        if (mounted) navigate("/login", { replace: true });
      }
    }

    loadUser();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const fetchAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    setAssignmentError("");

    try {
      const response = await api.get("/assignments/mine");
      const data = response.data;

      setAssignments(
        Array.isArray(data)
          ? data
          : data.assignments || data.data || []
      );
    } catch (err) {
      setAssignmentError(
        err.response?.data?.message ||
          "Unable to load assignments."
      );
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "INSTRUCTOR") fetchAssignments();
  }, [user, fetchAssignments]);

  function logout() {
    localStorage.removeItem("peergrade_token");
    localStorage.removeItem("peergrade_user");
    navigate("/login", { replace: true });
  }

  async function allocateReviews(assignment) {
    const id = assignment._id;

    setAllocatingId(id);
    setAssignmentError("");
    setAllocationResults((previous) => ({
      ...previous,
      [id]: null,
    }));

    try {
      const response = await api.post(`/reviews/allocate/${id}`);
      const result = response.data.result || response.data;

      setAllocationResults((previous) => ({
        ...previous,
        [id]: {
          success: true,
          message:
            response.data.message ||
            "Peer review allocation processed successfully.",
          submissionsCount: result.submissionsCount,
          newReviewsAllocated: result.newReviewsAllocated,
          totalReviewAssignments: result.totalReviewAssignments,
        },
      }));
    } catch (err) {
      setAllocationResults((previous) => ({
        ...previous,
        [id]: {
          success: false,
          message:
            err.response?.data?.message ||
            "Unable to allocate peer reviews.",
        },
      }));
    } finally {
      setAllocatingId("");
    }
  }

  if (!user) {
    return (
      <div className="pg-loading">
        <div className="pg-spinner" />
        <p>Loading your PeerGrade workspace...</p>
      </div>
    );
  }

  const role = user.role;
  const menu = navigation[role] || [];
  const titles = {
    STUDENT: "Student Workspace",
    INSTRUCTOR: "Instructor Workspace",
    ADMIN: "Administration",
  };

  return (
    <div className="pg-layout">
      <aside className="pg-sidebar">
        <button
          className="pg-brand"
          onClick={() => navigate("/dashboard")}
        >
          <span className="pg-logo">P</span>
          <span>
            <strong>PeerGrade</strong>
            <small>Academic Assessment</small>
          </span>
        </button>

        <div className="pg-workspace-label">WORKSPACE</div>

        <nav className="pg-navigation">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `pg-nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="pg-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="pg-nav-arrow">›</span>
            </NavLink>
          ))}
        </nav>

        <div className="pg-sidebar-bottom">
          <div className="pg-help-card">
            <div className="pg-help-icon">✦</div>
            <strong>PeerGrade</strong>
            <p>Fair reviews. Better learning.</p>
          </div>

          <button className="pg-logout" onClick={logout}>
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      <main className="pg-main">
        <header className="pg-topbar">
          <div>
            <div className="pg-breadcrumb">
              PeerGrade <span>/</span> {role}
            </div>
            <h2>{titles[role] || "Workspace"}</h2>
          </div>

          <div className="pg-profile">
            <div className="pg-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="pg-profile-text">
              <strong>{user.name || "User"}</strong>
              <span>{role}</span>
            </div>
          </div>
        </header>

        <div className="pg-content">
          <section className="pg-welcome">
            <div className="pg-welcome-copy">
              <span className="pg-eyebrow">YOUR ACADEMIC WORKSPACE</span>
              <h1>Welcome back, {user.name || "User"} 👋</h1>
              <p>
                {role === "INSTRUCTOR"
                  ? "Manage assignments, coordinate peer assessments, and release student grades."
                  : role === "STUDENT"
                    ? "Stay on top of assignments, complete peer reviews, and track your results."
                    : "Manage users and oversee the PeerGrade platform."}
              </p>
            </div>
            <div className="pg-welcome-art" aria-hidden="true">
              <div className="pg-art-circle">✓</div>
              <span>Learn</span>
              <span>Review</span>
              <span>Improve</span>
            </div>
          </section>

          <section className="pg-section">
            <div className="pg-section-heading">
              <div>
                <h2>Quick Access</h2>
                <p>Choose where you want to go next.</p>
              </div>
            </div>

            <div className="pg-quick-grid">
              {menu
                .filter((item) => item.path !== "/dashboard")
                .map((item, index) => (
                  <button
                    className="pg-quick-card"
                    key={item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <span className={`pg-quick-icon tone-${index % 4}`}>
                      {item.icon}
                    </span>
                    <span className="pg-quick-title">{item.label}</span>
                    <span className="pg-quick-description">
                      {item.path === "/instructor/grades"
                        ? "Calculate, review, and release grades."
                        : item.path === "/assignments/create"
                          ? "Create assignments and grading rubrics."
                          : item.path === "/calibration"
                            ? "Inspect reviewer scoring patterns."
                            : item.path === "/peer-reviews"
                              ? "Review assigned student submissions."
                              : item.path === "/results"
                                ? "View your released results."
                                : item.path === "/assignments"
                                  ? "View and submit coursework."
                                  : "Open this workspace."}
                    </span>
                    <span className="pg-card-link">Open workspace →</span>
                  </button>
                ))}
            </div>
          </section>

          <section className="pg-section pg-account">
            <div className="pg-section-heading">
              <div>
                <h2>Account Information</h2>
                <p>Your signed-in account details.</p>
              </div>
              <span className="pg-role-pill">{role}</span>
            </div>

            <div className="pg-account-grid">
              <div className="pg-account-item">
                <span>FULL NAME</span>
                <strong>{user.name || "Not provided"}</strong>
              </div>
              <div className="pg-account-item">
                <span>EMAIL ADDRESS</span>
                <strong>{user.email || "Not provided"}</strong>
              </div>
              <div className="pg-account-item">
                <span>ACCOUNT ROLE</span>
                <strong>{role}</strong>
              </div>
            </div>
          </section>

          {role === "INSTRUCTOR" && (
            <section className="pg-section">
              <div className="pg-section-heading pg-assignment-heading">
                <div>
                  <h2>My Assignments</h2>
                  <p>
                    Allocate reviews and manage grades from each assignment.
                  </p>
                </div>

                <div className="pg-heading-actions">
                  <button
                    className="pg-button pg-button-light"
                    onClick={fetchAssignments}
                    disabled={loadingAssignments}
                  >
                    {loadingAssignments ? "Refreshing..." : "↻ Refresh"}
                  </button>
                  <button
                    className="pg-button pg-button-primary"
                    onClick={() => navigate("/assignments/create")}
                  >
                    + New Assignment
                  </button>
                </div>
              </div>

              {assignmentError && (
                <div className="pg-alert pg-alert-error">
                  {assignmentError}
                </div>
              )}

              {loadingAssignments ? (
                <div className="pg-empty">Loading assignments...</div>
              ) : assignments.length === 0 ? (
                <div className="pg-empty">
                  <div className="pg-empty-icon">▤</div>
                  <h3>No assignments yet</h3>
                  <p>Create your first assignment to get started.</p>
                  <button
                    className="pg-button pg-button-primary"
                    onClick={() => navigate("/assignments/create")}
                  >
                    Create Assignment
                  </button>
                </div>
              ) : (
                <div className="pg-assignment-list">
                  {assignments.map((assignment) => {
                    const result = allocationResults[assignment._id];

                    return (
                      <article
                        key={assignment._id}
                        className="pg-assignment-card"
                      >
                        <div className="pg-assignment-top">
                          <div className="pg-assignment-symbol">▤</div>
                          <div className="pg-assignment-name">
                            <h3>{assignment.title}</h3>
                            <p>
                              {assignment.courseName ||
                                assignment.course ||
                                "Course not specified"}
                            </p>
                          </div>
                          <span className="pg-status">
                            {assignment.status || "PUBLISHED"}
                          </span>
                        </div>

                        <div className="pg-assignment-meta">
                          <div>
                            <span>MAXIMUM MARKS</span>
                            <strong>{assignment.maxMarks ?? "—"}</strong>
                          </div>
                          <div>
                            <span>DEADLINE</span>
                            <strong>
                              {assignment.deadline
                                ? new Date(
                                    assignment.deadline
                                  ).toLocaleString()
                                : "Not specified"}
                            </strong>
                          </div>
                        </div>

                        <div className="pg-assignment-actions">
                          <button
                            className="pg-button pg-button-primary"
                            onClick={() => allocateReviews(assignment)}
                            disabled={allocatingId === assignment._id}
                          >
                            {allocatingId === assignment._id
                              ? "Allocating..."
                              : "⇄ Allocate Peer Reviews"}
                          </button>

                          <button
                            className="pg-button pg-button-outline"
                            onClick={() =>
                              navigate(
                                `/instructor/grades?assignmentId=${assignment._id}`
                              )
                            }
                          >
                            ▥ Grade Management
                          </button>

                          <button
                            className="pg-button pg-button-light"
                            onClick={() => navigate("/calibration")}
                          >
                            ◎ Calibration
                          </button>
                        </div>

                        {result && (
                          <div
                            className={`pg-allocation-result ${
                              result.success ? "result-success" : "result-error"
                            }`}
                            role="status"
                          >
                            <strong>
                              {result.success
                                ? "✓ Allocation result"
                                : "Allocation failed"}
                            </strong>
                            <p>{result.message}</p>

                            {result.success && (
                              <div className="pg-result-stats">
                                <div>
                                  <span>Submissions</span>
                                  <strong>
                                    {result.submissionsCount ?? "—"}
                                  </strong>
                                </div>
                                <div>
                                  <span>New reviews</span>
                                  <strong>
                                    {result.newReviewsAllocated ?? "—"}
                                  </strong>
                                </div>
                                <div>
                                  <span>Total assignments</span>
                                  <strong>
                                    {result.totalReviewAssignments ?? "—"}
                                  </strong>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="pg-footer">
          <span>PeerGrade</span>
          <span>Blind Double-Peer Academic Assessment</span>
        </footer>
      </main>
    </div>
  );
}
