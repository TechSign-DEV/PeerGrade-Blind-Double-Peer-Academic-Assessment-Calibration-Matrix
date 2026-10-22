
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

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

        if (mounted) {
          navigate("/login", { replace: true });
        }
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
          : Array.isArray(data.assignments)
            ? data.assignments
            : []
      );
    } catch (err) {
      setAssignmentError(
        err.response?.data?.message ||
          "Could not load your assignments. Please try again."
      );
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "INSTRUCTOR") {
      fetchAssignments();
    }
  }, [user, fetchAssignments]);

  const logout = () => {
    localStorage.removeItem("peergrade_token");
    localStorage.removeItem("peergrade_user");
    navigate("/login", { replace: true });
  };

  const allocateReviews = async (assignment) => {
    const assignmentId = assignment._id;

    setAllocatingId(assignmentId);
    setAssignmentError("");

    setAllocationResults((previous) => ({
      ...previous,
      [assignmentId]: null,
    }));

    try {
      const response = await api.post(
        `/reviews/allocate/${assignmentId}`
      );

      const result = response.data.result || response.data;

      setAllocationResults((previous) => ({
        ...previous,
        [assignmentId]: {
          success: true,
          message:
            response.data.message ||
            "Peer reviews allocated successfully.",
          submissionsCount: result.submissionsCount,
          newReviewsAllocated: result.newReviewsAllocated,
          totalReviewAssignments: result.totalReviewAssignments,
        },
      }));
    } catch (err) {
      setAllocationResults((previous) => ({
        ...previous,
        [assignmentId]: {
          success: false,
          message:
            err.response?.data?.message ||
            "Unable to allocate peer reviews.",
        },
      }));
    } finally {
      setAllocatingId("");
    }
  };

  const content = {
    STUDENT: {
      title: "Student Dashboard",
      description:
        "Submit assignments, review assigned submissions, and view released grades.",
      links: [
        {
          label: "View Assignments",
          path: "/assignments",
          description: "View assignments and submit your work.",
        },
        {
          label: "Peer Reviews",
          path: "/peer-reviews",
          description: "Complete your assigned peer assessments.",
        },
        {
          label: "My Results",
          path: "/results",
          description: "View released grades and instructor feedback.",
        },
      ],
    },

    INSTRUCTOR: {
      title: "Instructor Dashboard",
      description:
        "Manage assignments, allocate peer reviews, and analyze grading results.",
      links: [
        {
          label: "Create Assignment",
          path: "/assignments/create",
          description: "Create an assignment and define its rubric.",
        },
        {
          label: "Calibration Dashboard",
          path: "/calibration",
          description: "Analyze score agreement and reviewer tendencies.",
        },
      ],
    },

    ADMIN: {
      title: "Admin Dashboard",
      description:
        "Manage platform users, roles, account status, and system activity.",
      links: [
        {
          label: "Admin Panel",
          path: "/admin",
          description: "Manage accounts and review platform statistics.",
        },
      ],
    },
  };

  if (!user) {
    return (
      <div style={styles.center}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const dashboard = content[user.role];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logo}>P</div>
          <div>
            <h2 style={styles.brandTitle}>PeerGrade</h2>
            <p style={styles.brandSubtitle}>
              Blind Double-Peer Assessment
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.userSummary}>
            <span style={styles.avatar}>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
            <div>
              <strong>{user.name}</strong>
              <span style={styles.headerRole}>{user.role}</span>
            </div>
          </div>

          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {!dashboard ? (
          <section style={styles.card}>
            <h1>Unable to load dashboard</h1>
            <p>
              Your account has an unrecognized role. Please contact
              the administrator.
            </p>
            <button onClick={logout} style={styles.primaryButton}>
              Return to Login
            </button>
          </section>
        ) : (
          <>
            <section style={styles.welcome}>
              <div>
                <p style={styles.eyebrow}>
                  PEERGRADE / {user.role}
                </p>
                <h1>Welcome, {user.name}!</h1>
                <p style={styles.description}>
                  {dashboard.description}
                </p>
              </div>
              <div style={styles.roleBadge}>{user.role}</div>
            </section>

            <section style={styles.accountCard}>
              <h2>Account Information</h2>
              <div style={styles.accountGrid}>
                <div>
                  <span style={styles.fieldLabel}>Full name</span>
                  <p style={styles.fieldValue}>{user.name}</p>
                </div>
                <div>
                  <span style={styles.fieldLabel}>Email address</span>
                  <p style={styles.fieldValue}>{user.email}</p>
                </div>
                <div>
                  <span style={styles.fieldLabel}>Account role</span>
                  <p style={styles.fieldValue}>{user.role}</p>
                </div>
              </div>
            </section>

            <section style={styles.section}>
              <h2>{dashboard.title}</h2>
              <p style={styles.sectionDescription}>
                Choose an action to continue.
              </p>

              <div style={styles.actionGrid}>
                {dashboard.links.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={styles.actionCard}
                  >
                    <div style={styles.actionIcon}>
                      {item.label.charAt(0)}
                    </div>
                    <h3>{item.label}</h3>
                    <p style={styles.actionDescription}>
                      {item.description}
                    </p>
                    <span style={styles.actionLink}>
                      Open page →
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {user.role === "INSTRUCTOR" && (
              <section style={styles.section}>
                <div style={styles.listHeader}>
                  <div>
                    <h2>My Assignments</h2>
                    <p style={styles.sectionDescription}>
                      Manage your assignments and allocate blind peer
                      reviews directly from here.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchAssignments}
                    disabled={loadingAssignments}
                    style={styles.secondaryButton}
                  >
                    {loadingAssignments ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {assignmentError && (
                  <div style={styles.error} role="alert">
                    {assignmentError}
                  </div>
                )}

                {loadingAssignments ? (
                  <p>Loading your assignments...</p>
                ) : assignments.length === 0 ? (
                  <div style={styles.card}>
                    <p>
                      No assignments found. Create an assignment first.
                    </p>
                    <Link to="/assignments/create">
                      Create Assignment →
                    </Link>
                  </div>
                ) : (
                  <div style={styles.assignmentGrid}>
                    {assignments.map((assignment) => {
                      const result =
                        allocationResults[assignment._id];

                      return (
                        <article
                          key={assignment._id}
                          style={styles.assignmentCard}
                        >
                          <div style={styles.assignmentHeader}>
                            <h3>{assignment.title}</h3>
                            <span style={styles.status}>
                              {assignment.status || "PUBLISHED"}
                            </span>
                          </div>

                          <p>
                            <strong>Course:</strong>{" "}
                            {assignment.courseName || "Not specified"}
                          </p>

                          <p>
                            <strong>Maximum marks:</strong>{" "}
                            {assignment.maxMarks}
                          </p>

                          <p>
                            <strong>Deadline:</strong>{" "}
                            {assignment.deadline
                              ? new Date(
                                  assignment.deadline
                                ).toLocaleString()
                              : "Not specified"}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              allocateReviews(assignment)
                            }
                            disabled={
                              allocatingId === assignment._id
                            }
                            style={styles.primaryButton}
                          >
                            {allocatingId === assignment._id
                              ? "Allocating Reviews..."
                              : "Allocate Peer Reviews"}
                          </button>

<button
  onClick={() =>
    navigate(`/instructor/grades?assignmentId=${assignment._id}`)
  }
>
  Grade Management
</button>

                          {result && (
                            <div
                              style={
                                result.success
                                  ? styles.success
                                  : styles.error
                              }
                              role="status"
                            >
                              <strong>
                                {result.success
                                  ? "Allocation result"
                                  : "Allocation failed"}
                              </strong>
                              <p>{result.message}</p>

                              {result.success && (
                                <>
                                  <p>
                                    Submissions:{" "}
                                    {result.submissionsCount ?? "—"}
                                  </p>
                                  <p>
                                    New reviews allocated:{" "}
                                    {result.newReviewsAllocated ?? "—"}
                                  </p>
                                  <p>
                                    Total review assignments:{" "}
                                    {result.totalReviewAssignments ?? "—"}
                                  </p>
                                </>
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
          </>
        )}
      </main>

      <footer style={styles.footer}>
        PeerGrade · Blind Double-Peer Academic Assessment
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#182237",
    fontFamily: "Arial, sans-serif",
  },
  center: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    padding: "18px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#4338ca",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontSize: "24px",
    fontWeight: "bold",
  },
  brandTitle: { margin: 0, fontSize: "21px" },
  brandSubtitle: {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "#64748b",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  userSummary: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "13px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#4338ca",
    display: "grid",
    placeItems: "center",
    fontSize: "17px",
    fontWeight: "bold",
  },
  headerRole: {
    display: "block",
    marginTop: "4px",
    fontSize: "11px",
    color: "#64748b",
  },
  logoutButton: {
    padding: "10px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "9px",
    background: "#fff",
    color: "#b91c1c",
    fontWeight: "bold",
    cursor: "pointer",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  welcome: {
    padding: "30px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#4f46e5",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1.4px",
  },
  roleBadge: {
    padding: "8px 12px",
    background: "#eef2ff",
    color: "#4338ca",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  description: {
    maxWidth: "650px",
    color: "#64748b",
    lineHeight: 1.7,
  },
  accountCard: {
    marginTop: "24px",
    padding: "24px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
  },
  accountGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "24px",
    marginTop: "20px",
  },
  fieldLabel: { color: "#64748b", fontSize: "12px" },
  fieldValue: {
    marginBottom: 0,
    fontWeight: "bold",
    overflowWrap: "anywhere",
  },
  section: { marginTop: "36px" },
  sectionDescription: {
    color: "#64748b",
    marginTop: "6px",
    lineHeight: 1.6,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  actionCard: {
    display: "block",
    padding: "24px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    textDecoration: "none",
    color: "#182237",
    boxShadow: "0 4px 16px rgba(20, 30, 60, 0.03)",
  },
  actionIcon: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    borderRadius: "11px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "20px",
    fontWeight: "bold",
  },
  actionDescription: {
    minHeight: "44px",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  actionLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#4338ca",
    fontSize: "13px",
    fontWeight: "bold",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  assignmentGrid: { display: "grid", gap: "16px" },
  assignmentCard: {
    padding: "22px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    background: "#fff",
    overflowWrap: "anywhere",
  },
  assignmentHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  status: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  primaryButton: {
    padding: "11px 16px",
    background: "#4338ca",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  secondaryButton: {
    padding: "10px 14px",
    background: "#fff",
    color: "#4338ca",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    cursor: "pointer",
  },
  card: {
    background: "#fff",
    padding: "28px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
  },
  success: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "9px",
    background: "#dcfce7",
    color: "#166534",
    overflowWrap: "anywhere",
  },
  error: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "9px",
    background: "#fee2e2",
    color: "#991b1b",
    overflowWrap: "anywhere",
  },
  footer: {
    padding: "24px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px",
  },
};
