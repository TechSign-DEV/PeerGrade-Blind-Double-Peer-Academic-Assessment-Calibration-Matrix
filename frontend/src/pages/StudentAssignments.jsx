
import { useEffect, useState } from "react";
import api from "../services/api";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [contents, setContents] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setError("");

      const [assignmentResponse, submissionResponse] =
        await Promise.all([
          api.get("/assignments"),
          api.get("/submissions/mine"),
        ]);

      setAssignments(assignmentResponse.data.assignments);
      setSubmissions(submissionResponse.data.submissions);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load assignments. Please log in again if necessary."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (assignmentId) => {
    const content = contents[assignmentId]?.trim();

    if (!content) {
      setError("Please enter your assignment before submitting.");
      return;
    }

    setError("");
    setMessage("");
    setSubmittingId(assignmentId);

    try {
      await api.post(`/submissions/${assignmentId}`, {
        content,
      });

      setMessage("Assignment submitted successfully!");

      setContents((previous) => ({
        ...previous,
        [assignmentId]: "",
      }));

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Submission failed. Please try again."
      );
    } finally {
      setSubmittingId("");
    }
  };

  if (loading) {
    return <p style={{ padding: "24px" }}>Loading assignments...</p>;
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "30px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>My Assignments</h1>

      <p style={{ color: "#6b7280" }}>
        View your assignments, check deadlines, and submit your work.
      </p>

      {error && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: "#15803d" }}>
          {message}
        </p>
      )}

      {assignments.length === 0 ? (
        <p>No published assignments are available.</p>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {assignments.map((assignment) => {
            const existingSubmission = submissions.find(
              (submission) =>
                submission.assignment?._id === assignment._id
            );

            const expired =
              new Date(assignment.deadline).getTime() <= Date.now();

            return (
              <article
                key={assignment._id}
                style={{
                  padding: "24px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  background: "#ffffff",
                }}
              >
                <h2>{assignment.title}</h2>

                <p>{assignment.description}</p>

                <p>
                  <strong>Course:</strong> {assignment.courseName}
                </p>

                <p>
                  <strong>Maximum marks:</strong> {assignment.maxMarks}
                </p>

                <p>
                  <strong>Deadline:</strong>{" "}
                  {new Date(assignment.deadline).toLocaleString()}
                </p>

                {existingSubmission ? (
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      background: "#f0fdf4",
                      color: "#166534",
                    }}
                  >
                    <strong>Submitted successfully</strong>
                    <p>
                      Submitted on:{" "}
                      {new Date(
                        existingSubmission.submittedAt
                      ).toLocaleString()}
                    </p>
                    <p>
                      Status: {existingSubmission.status}
                    </p>
                  </div>
                ) : expired ? (
                  <p style={{ color: "#b91c1c" }}>
                    Submission deadline has passed.
                  </p>
                ) : (
                  <div>
                    <label
                      htmlFor={`content-${assignment._id}`}
                    >
                      Your assignment
                    </label>

                    <textarea
                      id={`content-${assignment._id}`}
                      value={contents[assignment._id] || ""}
                      onChange={(e) =>
                        setContents((previous) => ({
                          ...previous,
                          [assignment._id]: e.target.value,
                        }))
                      }
                      placeholder="Write your assignment here..."
                      rows={6}
                      maxLength={50000}
                      style={{
                        display: "block",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        marginTop: "8px",
                        marginBottom: "12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        font: "inherit",
                      }}
                    />

                    <button
                      type="button"
                      disabled={submittingId === assignment._id}
                      onClick={() => handleSubmit(assignment._id)}
                      style={{
                        background: "#4338ca",
                        color: "#ffffff",
                        padding: "12px 18px",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {submittingId === assignment._id
                        ? "Submitting..."
                        : "Submit Assignment"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
