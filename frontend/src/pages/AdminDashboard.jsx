
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"];

function StatCard({ label, value }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </article>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { role: roleFilter };

      if (search.trim()) params.search = search.trim();

      const [statsResponse, usersResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users", { params })
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load the admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function changeStatus(user) {
    const nextStatus = !user.isActive;
    const action = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    setBusyId(user._id);
    setError("");
    setNotice("");

    try {
      await api.patch(`/admin/users/${user._id}/status`, {
        isActive: nextStatus
      });

      setNotice(`Account ${nextStatus ? "activated" : "deactivated"}.`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not update this account."
      );
    } finally {
      setBusyId("");
    }
  }

  async function changeRole(user, nextRole) {
    if (nextRole === user.role) return;

    if (
      !window.confirm(
        `Change ${user.name}'s role from ${user.role} to ${nextRole}?`
      )
    ) {
      return;
    }

    setBusyId(user._id);
    setError("");
    setNotice("");

    try {
      await api.patch(`/admin/users/${user._id}/role`, {
        role: nextRole
      });

      setNotice("User role updated.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not update the user's role."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">PEERGRADE / ADMINISTRATION</p>
          <h1>Platform administration</h1>
          <p>Manage user accounts, roles, and platform activity.</p>
        </div>

        <Link to="/dashboard" className="admin-back-link">
          Back to dashboard
        </Link>
      </header>

      {error && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {notice && <div className="admin-alert admin-alert-success" role="status">{notice}</div>}

      {loading && !stats ? (
        <div className="admin-panel">Loading platform data...</div>
      ) : (
        <>
          {stats && (
            <>
              <section className="admin-section">
                <h2>Users</h2>
                <div className="admin-stats-grid">
                  <StatCard label="Total users" value={stats.users.total} />
                  <StatCard label="Students" value={stats.users.students} />
                  <StatCard label="Instructors" value={stats.users.instructors} />
                  <StatCard label="Administrators" value={stats.users.admins} />
                  <StatCard label="Active accounts" value={stats.users.active} />
                  <StatCard label="Inactive accounts" value={stats.users.inactive} />
                </div>
              </section>

              <section className="admin-section">
                <h2>Platform activity</h2>
                <div className="admin-stats-grid admin-stats-grid-four">
                  <StatCard label="Assignments" value={stats.platform.assignments} />
                  <StatCard label="Submissions" value={stats.platform.submissions} />
                  <StatCard label="Completed reviews" value={stats.platform.completedPeerReviews} />
                  <StatCard label="Released grades" value={stats.platform.releasedGrades} />
                </div>
              </section>
            </>
          )}

          <section className="admin-panel">
            <div className="admin-users-heading">
              <div>
                <h2>User management</h2>
                <p>Search accounts and manage their access.</p>
              </div>

              <button
                type="button"
                className="admin-refresh"
                onClick={loadData}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            <div className="admin-filters">
              <label>
                Search users
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                />
              </label>

              <label>
                Filter by role
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                >
                  <option value="ALL">All roles</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>

            <p className="admin-result-count">
              Showing {users.length} account(s). The API currently returns
              up to 200 matching accounts.
            </p>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Change role</th>
                    <th>Account action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                        <span className="admin-email">{user.email}</span>
                      </td>

                      <td>
                        <span className={`admin-role admin-role-${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span className={user.isActive ? "admin-active" : "admin-inactive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      <td>
                        <select
                          aria-label={`Change role for ${user.name}`}
                          value={user.role}
                          disabled={busyId === user._id}
                          onChange={(event) => changeRole(user, event.target.value)}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <button
                          type="button"
                          className={user.isActive ? "admin-deactivate" : "admin-activate"}
                          disabled={busyId === user._id}
                          onClick={() => changeStatus(user)}
                        >
                          {busyId === user._id
                            ? "Saving..."
                            : user.isActive
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="admin-empty">
                        No matching users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
