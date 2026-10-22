
import { useEffect, useState } from "react";
import api from "../services/api";

export default function PeerReview() {
  const [reviews, setReviews] = useState([]);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadReviews() {
    try {
      const response = await api.get("/reviews/mine");
      setReviews(response.data.reviews || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load assigned reviews."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  function updateScore(reviewId, criterionId, field, value) {
    setScores((previous) => ({
      ...previous,
      [reviewId]: {
        ...previous[reviewId],
        [criterionId]: {
          ...previous[reviewId]?.[criterionId],
          [field]: value,
        },
      },
    }));
  }

  async function submitReview(review) {
    const reviewId = review.reviewId;
    const rubric = review.submission.assignment?.rubric || [];

    if (rubric.length === 0) {
      setError("This assignment does not have a grading rubric.");
      return;
    }

    const rubricScores = rubric.map((criterion) => {
      const value = scores[reviewId]?.[criterion._id];

      return {
        criterionId: criterion._id,
        marks: value?.marks === undefined
          ? NaN
          : Number(value.marks),
        feedback: value?.feedback || "",
      };
    });

    if (
      rubricScores.some(
        (item) =>
          !Number.isFinite(item.marks) ||
          item.marks < 0
      )
    ) {
      setError("Enter marks for every rubric criterion.");
      return;
    }

    if (
      rubricScores.some((item, index) =>
        item.marks > rubric[index].maxMarks
      )
    ) {
      setError("Marks cannot exceed the maximum for a criterion.");
      return;
    }

    setError("");
    setMessage("");
    setSavingId(reviewId);

    try {
      await api.post(`/reviews/${reviewId}/submit`, {
        rubricScores,
        overallFeedback: feedback[reviewId] || "",
      });

      setMessage("Review submitted successfully.");

      // Refresh statuses so the completed review cannot be resubmitted.
      await loadReviews();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit this review."
      );
    } finally {
      setSavingId("");
    }
  }

  if (loading) {
    return <p style={{ padding: 24 }}>Loading peer reviews...</p>;
  }

  const pendingReviews = reviews.filter(
    (review) => review.status === "PENDING"
  );

  const completedReviews = reviews.filter(
    (review) => review.status === "COMPLETED"
  );

  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "32px auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Peer Review Workspace</h1>
      <p>Review anonymous submissions using the grading rubric.</p>

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

      {reviews.length === 0 && (
        <p>No peer reviews have been assigned to you yet.</p>
      )}

      {pendingReviews.map((review) => {
        const assignment = review.submission.assignment;
        const rubric = assignment?.rubric || [];

        return (
          <section
            key={review.reviewId}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              background: "#fff",
            }}
          >
            <h2>{assignment?.title || "Assignment review"}</h2>

            <p>
              <strong>Course:</strong>{" "}
              {assignment?.courseName || "—"}
            </p>

            <p>
              <strong>Maximum marks:</strong>{" "}
              {assignment?.maxMarks ?? "—"}
            </p>

            <div
              style={{
                padding: 16,
                borderRadius: 8,
                background: "#f9fafb",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                margin: "16px 0",
              }}
            >
              <strong>Anonymous submission</strong>
              <p>{review.submission.content}</p>
            </div>

            <h3>Grading rubric</h3>

            {rubric.map((criterion) => (
              <div
                key={criterion._id}
                style={{
                  borderTop: "1px solid #e5e7eb",
                  padding: "16px 0",
                }}
              >
                <label>
                  <strong>{criterion.criterion}</strong>
                  {" — "}
                  Maximum {criterion.maxMarks} marks
                </label>

                {criterion.description && (
                  <p>{criterion.description}</p>
                )}

                <input
                  type="number"
                  min="0"
                  max={criterion.maxMarks}
                  step="any"
                  required
                  value={
                    scores[review.reviewId]?.[criterion._id]
                      ?.marks ?? ""
                  }
                  onChange={(e) =>
                    updateScore(
                      review.reviewId,
                      criterion._id,
                      "marks",
                      e.target.value
                    )
                  }
                  placeholder="Enter marks"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    marginTop: 8,
                  }}
                />

                <textarea
                  rows={2}
                  maxLength={2000}
                  value={
                    scores[review.reviewId]?.[criterion._id]
                      ?.feedback ?? ""
                  }
                  onChange={(e) =>
                    updateScore(
                      review.reviewId,
                      criterion._id,
                      "feedback",
                      e.target.value
                    )
                  }
                  placeholder="Feedback for this criterion (optional)"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    marginTop: 8,
                  }}
                />
              </div>
            ))}

            <label>
              <strong>Overall feedback</strong>
              <textarea
                rows={4}
                maxLength={5000}
                value={feedback[review.reviewId] || ""}
                onChange={(e) =>
                  setFeedback((previous) => ({
                    ...previous,
                    [review.reviewId]: e.target.value,
                  }))
                }
                placeholder="Write constructive feedback..."
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 12,
                  marginTop: 8,
                }}
              />
            </label>

            <button
              type="button"
              disabled={savingId === review.reviewId}
              onClick={() => submitReview(review)}
              style={{
                marginTop: 16,
                padding: "12px 18px",
                border: 0,
                borderRadius: 8,
                background: "#4338ca",
                color: "white",
                cursor: "pointer",
              }}
            >
              {savingId === review.reviewId
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </section>
        );
      })}

      <h2>Completed Reviews ({completedReviews.length})</h2>

      {completedReviews.map((review) => (
        <div
          key={review.reviewId}
          style={{
            border: "1px solid #d1d5db",
            padding: 16,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {review.submission.assignment?.title ||
            "Assignment review"}
          {" — "}
          <strong>Completed</strong>
        </div>
      ))}
    </main>
  );
}
