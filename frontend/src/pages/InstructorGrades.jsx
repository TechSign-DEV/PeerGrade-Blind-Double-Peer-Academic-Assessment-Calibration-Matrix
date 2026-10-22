
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function InstructorGrades() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState(
    searchParams.get("assignmentId") || ""
  );
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (assignmentId) {
      loadGrades(assignmentId);
    } else {
      setGrades([]);
    }
  }, [assignmentId]);

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/assignments/mine");
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.assignments || data.data || [];

      setAssignments(list);

      const requestedId = searchParams.get("assignmentId");
      const exists = list.some((item) => item._id === requestedId);

      if (requestedId && exists) {
        setAssignmentId(requestedId);
      } else if (list.length > 0 && !assignmentId) {
        setAssignmentId(list[0]._id);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load assignments. Please log in as an instructor."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadGrades(id = assignmentId) {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/grades/assignment/${id}`);
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : data.grades || data.data || [];

      setGrades(list);

      const initialFeedback = {};
      list.forEach((grade) => {
        initialFeedback[grade._id] = grade.instructorFeedback || "";
      });
      setFeedback(initialFeedback);
    } catch (err) {
      setGrades([]);
      setError(
        err.response?.data?.message ||
          "Could not load grades. Try calculating draft grades first."
      );
    } finally {
      setLoading(false);
    }
  }

  async function calculateGrades() {
    if (!assignmentId) {
      setError("Please select an assignment.");
      return;
    }

    try {
      setCalculating(true);
      setError("");
      setMessage("");

      const response = await api.post(
        `/grades/calculate/${assignmentId}`
      );

      setMessage(
        response.data.message ||
          "Grade calculation completed successfully."
      );

      await loadGrades(assignmentId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not calculate grades. Ensure at least two peer reviews are completed for each submission."
      );
    } finally {
      setCalculating(false);
    }
  }

  async function saveFeedback(gradeId) {
    try {
      setError("");
      setMessage("");

      await api.patch(`/grades/${gradeId}/feedback`, {
        instructorFeedback: feedback[gradeId] || "",
      });

      setMessage("Instructor feedback saved successfully.");
      await loadGrades(assignmentId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save feedback."
      );
    }
  }

  async function releaseGrade(gradeId) {
    const confirmed = window.confirm(
      "Release this grade to the student? The student will then be able to view it."
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.patch(`/grades/${gradeId}/release`);

      setMessage("Grade released successfully.");
      await loadGrades(assignmentId);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not release this grade. Check that at least two peer reviews are completed."
      );
    }
  }

  const selectedAssignment = assignments.find(
    (item) => item._id === assignmentId
  );

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Grade Management</h1>
          <p style={styles.subtitle}>
            Calculate grades, review marks, add feedback, and release results.
          </p>
        </div>

        <button
          style={styles.secondaryButton}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <section style={styles.panel}>
        <label style={styles.label} htmlFor="assignment">
          Select Assignment
        </label>

        <select
          id="assignment"
          value={assignmentId}
          onChange={(event) => {
            setAssignmentId(event.target.value);
            setMessage("");
            setError("");
          }}
          style={styles.select}
        >
          <option value="">Choose an assignment</option>
          {assignments.map((assignment) => (
            <option key={assignment._id} value={assignment._id}>
              {assignment.title} — {assignment.course}
            </option>
          ))}
        </select>

        {selectedAssignment && (
          <p style={styles.info}>
            Maximum marks: {selectedAssignment.maxMarks}
          </p>
        )}

        <button
          style={styles.primaryButton}
          onClick={calculateGrades}
          disabled={!assignmentId || calculating}
        >
          {calculating ? "Calculating..." : "Calculate Draft Grades"}
        </button>

        <button
          style={styles.secondaryButton}
          onClick={() => loadGrades()}
          disabled={!assignmentId || loading}
        >
          Refresh Grades
        </button>
      </section>

      <section style={styles.panel}>
        <h2 style={styles.heading}>Student Grades</h2>

        {loading ? (
          <p>Loading...</p>
        ) : !assignmentId ? (
          <p>Select an assignment to manage its grades.</p>
        ) : grades.length === 0 ? (
          <p>
            No grades found yet. Complete the required peer reviews, then
            click Calculate Draft Grades.
          </p>
        ) : (
          <div style={styles.gradeList}>
            {grades.map((grade) => {
              const student = grade.student || {};
              const submission = grade.submission || {};
              const released = grade.status === "RELEASED";

              return (
                <article key={grade._id} style={styles.gradeCard}>
                  <div style={styles.gradeHeader}>
                    <div>
                      <h3 style={styles.studentName}>
                        {student.name ||
                          student.fullName ||
                          student.email ||
                          "Student"}
                      </h3>
                      <p style={styles.info}>
                        {student.email || ""}
                      </p>
                    </div>

                    <span
                      style={{
                        ...styles.status,
                        ...(released
                          ? styles.released
                          : styles.draft),
                      }}
                    >
                      {grade.status || "DRAFT"}
                    </span>
                  </div>

                  <p style={styles.score}>
                    Marks: {grade.calculatedMarks ?? "—"} /{" "}
                    {grade.maxMarks ?? selectedAssignment?.maxMarks ?? "—"}
                  </p>

                  <p style={styles.info}>
                    Completed peer reviews: {grade.peerReviewCount ?? 0}
                  </p>

                  {submission.title && (
                    <p style={styles.info}>
                      Submission: {submission.title}
                    </p>
                  )}

                  <label style={styles.label} htmlFor={`feedback-${grade._id}`}>
                    Instructor Feedback
                  </label>

                  <textarea
                    id={`feedback-${grade._id}`}
                    style={styles.textarea}
                    value={feedback[grade._id] ?? ""}
                    maxLength={5000}
                    disabled={released}
                    placeholder="Enter feedback for this student..."
                    onChange={(event) =>
                      setFeedback((previous) => ({
                        ...previous,
                        [grade._id]: event.target.value,
                      }))
                    }
                  />

                  {!released && (
                    <div style={styles.actions}>
                      <button
                        style={styles.secondaryButton}
                        onClick={() => saveFeedback(grade._id)}
                      >
                        Save Feedback
                      </button>

                      <button
                        style={styles.primaryButton}
                        disabled={(grade.peerReviewCount ?? 0) < 2}
                        onClick={() => releaseGrade(grade._id)}
                      >
                        Release Grade
                      </button>
                    </div>
                  )}

                  {released && (
                    <p style={styles.info}>
                      This grade has been released to the student.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "#f4f6fb",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "30px",
  },
  subtitle: {
    color: "#64748b",
    margin: 0,
  },
  panel: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  heading: {
    marginTop: 0,
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "8px",
  },
  select: {
    width: "100%",
    maxWidth: "600px",
    display: "block",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    marginBottom: "16px",
    background: "#fff",
  },
  primaryButton: {
    background: "#4338ca",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 16px",
    cursor: "pointer",
    margin: "4px 8px 4px 0",
  },
  secondaryButton: {
    background: "#fff",
    color: "#3730a3",
    border: "1px solid #c7d2fe",
    borderRadius: "8px",
    padding: "11px 16px",
    cursor: "pointer",
    margin: "4px 8px 4px 0",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  success: {
    background: "#dcfce7",
    color: "#166534",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  info: {
    color: "#64748b",
    fontSize: "14px",
    overflowWrap: "anywhere",
  },
  gradeList: {
    display: "grid",
    gap: "16px",
  },
  gradeCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "20px",
  },
  gradeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  studentName: {
    margin: "0 0 4px",
  },
  score: {
    fontSize: "20px",
    fontWeight: 700,
  },
  status: {
    borderRadius: "20px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: 700,
  },
  draft: {
    background: "#fef3c7",
    color: "#92400e",
  },
  released: {
    background: "#dcfce7",
    color: "#166534",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
};
