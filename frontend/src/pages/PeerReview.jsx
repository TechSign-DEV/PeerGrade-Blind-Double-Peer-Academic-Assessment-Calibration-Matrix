
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function PeerReview() {
  const [reviews, setReviews] = useState([]);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const response = await api.get("/reviews/mine");
      setReviews(response.data.reviews || []);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load assigned reviews."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
        marks:
          value?.marks === undefined || value.marks === ""
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
      setError("Please enter valid marks for every rubric criterion.");
      return;
    }

    if (
      rubricScores.some(
        (item, index) =>
          item.marks > Number(rubric[index].maxMarks)
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

      setMessage("Your peer review was submitted successfully.");
      await loadReviews(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit this review."
      );
    } finally {
      setSavingId("");
    }
  }

  const pendingReviews = reviews.filter(
    (review) => review.status === "PENDING"
  );

  const completedReviews = reviews.filter(
    (review) => review.status === "COMPLETED"
  );

  const totalReviews = reviews.length;
  const progress =
    totalReviews > 0
      ? Math.round((completedReviews.length / totalReviews) * 100)
      : 0;

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="pr-loading">
          <div className="pr-spinner" />
          <h3>Loading your reviews</h3>
          <p>Preparing your peer assessment workspace...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>

      <main className="pr-page">
        <header className="pr-topbar">
          <div className="pr-brand">
            <div className="pr-logo">P</div>
            <div>
              <strong>PeerGrade</strong>
              <span>Academic Assessment</span>
            </div>
          </div>

          <Link className="pr-back-link" to="/dashboard">
            ← Dashboard
          </Link>
        </header>

        <div className="pr-container">
          <section className="pr-hero">
            <div className="pr-hero-copy">
              <div className="pr-eyebrow">
                <span className="pr-eyebrow-dot" />
                STUDENT WORKSPACE
              </div>

              <h1>Peer Review Workspace</h1>

              <p>
                Share constructive feedback, evaluate submissions fairly,
                and help your classmates improve their work.
              </p>

              <div className="pr-hero-note">
                <span>◈</span>
                Reviewer assignments are anonymous to protect blind review.
              </div>
            </div>

            <div className="pr-hero-art" aria-hidden="true">
              <div className="pr-art-ring pr-ring-one" />
              <div className="pr-art-ring pr-ring-two" />
              <div className="pr-art-document">
                <div className="pr-art-line" />
                <div className="pr-art-line short" />
                <div className="pr-art-check">✓</div>
                <div className="pr-art-line" />
                <div className="pr-art-line medium" />
              </div>
              <div className="pr-art-star">✦</div>
            </div>
          </section>

          {error && (
            <div className="pr-alert pr-alert-error" role="alert">
              <span className="pr-alert-icon">!</span>
              <div>
                <strong>Something needs your attention</strong>
                <p>{error}</p>
              </div>
              <button
                className="pr-alert-close"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {message && (
            <div className="pr-alert pr-alert-success" role="status">
              <span className="pr-alert-icon">✓</span>
              <div>
                <strong>Success</strong>
                <p>{message}</p>
              </div>
              <button
                className="pr-alert-close"
                onClick={() => setMessage("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <section className="pr-stats-grid">
            <article className="pr-stat-card">
              <div className="pr-stat-icon purple">▤</div>
              <div>
                <span className="pr-stat-label">TOTAL ASSIGNED</span>
                <strong>{totalReviews}</strong>
                <small>Reviews assigned to you</small>
              </div>
            </article>

            <article className="pr-stat-card">
              <div className="pr-stat-icon orange">✎</div>
              <div>
                <span className="pr-stat-label">PENDING</span>
                <strong>{pendingReviews.length}</strong>
                <small>Reviews to complete</small>
              </div>
            </article>

            <article className="pr-stat-card">
              <div className="pr-stat-icon green">✓</div>
              <div>
                <span className="pr-stat-label">COMPLETED</span>
                <strong>{completedReviews.length}</strong>
                <small>Reviews submitted</small>
              </div>
            </article>
          </section>

          <section className="pr-progress-panel">
            <div className="pr-progress-heading">
              <div>
                <h2>Your review progress</h2>
                <p>Every completed review helps improve learning.</p>
              </div>
              <strong className="pr-progress-percent">{progress}%</strong>
            </div>

            <div
              className="pr-progress-track"
              role="progressbar"
              aria-label="Peer review completion"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="pr-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="pr-progress-footer">
              <span>{completedReviews.length} completed</span>
              <span>{pendingReviews.length} remaining</span>
            </div>
          </section>

          <section className="pr-section">
            <div className="pr-section-heading">
              <div>
                <div className="pr-section-kicker">YOUR TASKS</div>
                <h2>Pending Reviews</h2>
                <p>Evaluate each submission using its grading rubric.</p>
              </div>

              <span className="pr-count-badge">
                {pendingReviews.length} pending
              </span>
            </div>

            {pendingReviews.length === 0 ? (
              <div className="pr-empty">
                <div className="pr-empty-icon">✓</div>
                <h3>You're all caught up!</h3>
                <p>
                  {totalReviews === 0
                    ? "No peer reviews have been assigned to you yet. Check back after your instructor allocates reviews."
                    : "You have completed all your assigned peer reviews. Great work!"}
                </p>
                <button
                  className="pr-button pr-button-secondary"
                  onClick={() => loadReviews()}
                >
                  ↻ Refresh Reviews
                </button>
              </div>
            ) : (
              <div className="pr-review-list">
                {pendingReviews.map((review, index) => {
                  const assignment = review.submission.assignment;
                  const rubric = assignment?.rubric || [];
                  const reviewId = review.reviewId;
                  const currentScores = scores[reviewId] || {};

                  return (
                    <article className="pr-review-card" key={reviewId}>
                      <div className="pr-review-card-header">
                        <div className="pr-review-number">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="pr-review-title">
                          <div className="pr-review-tag">
                            <span className="pr-status-dot" />
                            AWAITING REVIEW
                          </div>
                          <h3>{assignment?.title || "Assignment review"}</h3>
                          <p>
                            {assignment?.courseName || "Course not specified"}
                          </p>
                        </div>

                        <div className="pr-max-score">
                          <strong>{assignment?.maxMarks ?? "—"}</strong>
                          <span>MAX MARKS</span>
                        </div>
                      </div>

                      <div className="pr-submission">
                        <div className="pr-submission-heading">
                          <div className="pr-submission-icon">▤</div>
                          <div>
                            <strong>Anonymous Submission</strong>
                            <span>Review the work objectively</span>
                          </div>
                          <span className="pr-blind-badge">◈ Blind review</span>
                        </div>

                        <div className="pr-submission-content">
                          {review.submission.content || "No submission text provided."}
                        </div>
                      </div>

                      <div className="pr-rubric-section">
                        <div className="pr-rubric-heading">
                          <div>
                            <h4>Grading Rubric</h4>
                            <p>Score every criterion before submitting.</p>
                          </div>
                          <span>{rubric.length} criteria</span>
                        </div>

                        {rubric.length === 0 ? (
                          <div className="pr-rubric-error">
                            This assignment does not have a grading rubric.
                            Please contact your instructor.
                          </div>
                        ) : (
                          <div className="pr-criteria-list">
                            {rubric.map((criterion, criterionIndex) => (
                              <div
                                className="pr-criterion"
                                key={criterion._id}
                              >
                                <div className="pr-criterion-heading">
                                  <div className="pr-criterion-number">
                                    {criterionIndex + 1}
                                  </div>
                                  <div className="pr-criterion-title">
                                    <strong>{criterion.criterion}</strong>
                                    {criterion.description && (
                                      <p>{criterion.description}</p>
                                    )}
                                  </div>
                                  <span className="pr-criterion-max">
                                    / {criterion.maxMarks} marks
                                  </span>
                                </div>

                                <div className="pr-criterion-fields">
                                  <div className="pr-field">
                                    <label
                                      htmlFor={`score-${reviewId}-${criterion._id}`}
                                    >
                                      Score
                                    </label>
                                    <div className="pr-score-input-wrap">
                                      <input
                                        id={`score-${reviewId}-${criterion._id}`}
                                        type="number"
                                        min="0"
                                        max={criterion.maxMarks}
                                        step="any"
                                        required
                                        value={
                                          currentScores[criterion._id]?.marks ?? ""
                                        }
                                        onChange={(event) =>
                                          updateScore(
                                            reviewId,
                                            criterion._id,
                                            "marks",
                                            event.target.value
                                          )
                                        }
                                        placeholder="0"
                                      />
                                      <span>
                                        / {criterion.maxMarks}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pr-field pr-feedback-field">
                                    <label
                                      htmlFor={`criterion-feedback-${reviewId}-${criterion._id}`}
                                    >
                                      Criterion feedback
                                      <span>Optional</span>
                                    </label>
                                    <textarea
                                      id={`criterion-feedback-${reviewId}-${criterion._id}`}
                                      rows={2}
                                      maxLength={2000}
                                      value={
                                        currentScores[criterion._id]?.feedback || ""
                                      }
                                      onChange={(event) =>
                                        updateScore(
                                          reviewId,
                                          criterion._id,
                                          "feedback",
                                          event.target.value
                                        )
                                      }
                                      placeholder="What did the submission do well? What could improve?"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pr-overall-feedback">
                        <div className="pr-overall-heading">
                          <div className="pr-feedback-symbol">✎</div>
                          <div>
                            <h4>Overall Feedback</h4>
                            <p>Share useful, respectful suggestions.</p>
                          </div>
                        </div>

                        <textarea
                          rows={4}
                          maxLength={5000}
                          value={feedback[reviewId] || ""}
                          onChange={(event) =>
                            setFeedback((previous) => ({
                              ...previous,
                              [reviewId]: event.target.value,
                            }))
                          }
                          placeholder="Summarize strengths, areas to improve, and suggestions for the author..."
                        />

                        <div className="pr-character-count">
                          {(feedback[reviewId] || "").length}/5000 characters
                        </div>
                      </div>

                      <div className="pr-review-footer">
                        <p>
                          <span>◈</span> Review carefully. Submitted reviews
                          are marked complete.
                        </p>

                        <button
                          type="button"
                          className="pr-button pr-button-primary"
                          disabled={
                            savingId === reviewId || rubric.length === 0
                          }
                          onClick={() => submitReview(review)}
                        >
                          {savingId === reviewId ? (
                            <>
                              <span className="pr-button-spinner" />
                              Submitting...
                            </>
                          ) : (
                            <>Submit Review <span>→</span></>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="pr-section pr-completed-section">
            <div className="pr-section-heading">
              <div>
                <div className="pr-section-kicker">YOUR HISTORY</div>
                <h2>Completed Reviews</h2>
                <p>Peer assessments you've already submitted.</p>
              </div>

              <span className="pr-completed-badge">
                ✓ {completedReviews.length} completed
              </span>
            </div>

            {completedReviews.length === 0 ? (
              <div className="pr-completed-empty">
                Your submitted reviews will appear here.
              </div>
            ) : (
              <div className="pr-completed-list">
                {completedReviews.map((review) => (
                  <article
                    className="pr-completed-card"
                    key={review.reviewId}
                  >
                    <div className="pr-completed-icon">✓</div>
                    <div className="pr-completed-details">
                      <strong>
                        {review.submission.assignment?.title ||
                          "Assignment review"}
                      </strong>
                      <span>
                        {review.submission.assignment?.courseName ||
                          "Peer assessment"}
                      </span>
                    </div>
                    <span className="pr-completed-status">Completed</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="pr-footer">
            <strong>PeerGrade</strong>
            <span>Fair reviews. Better learning.</span>
          </footer>
        </div>
      </main>
    </>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

.pr-page {
  min-height: 100vh;
  background: #f6f7fc;
  color: #22243a;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 13px;
}

.pr-topbar {
  min-height: 76px;
  padding: 15px clamp(18px, 4vw, 55px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #fff;
  border-bottom: 1px solid #e9eaf2;
}

.pr-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.pr-logo {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(140deg, #6a5df0, #4438bd);
  color: #fff;
  font-size: 23px;
  font-weight: 850;
  box-shadow: 0 5px 15px #5145cd2b;
}

.pr-brand strong,
.pr-brand span {
  display: block;
}

.pr-brand strong {
  font-size: 18px;
  letter-spacing: -.5px;
}

.pr-brand span {
  margin-top: 4px;
  color: #83889b;
  font-size: 10px;
}

.pr-back-link {
  padding: 10px 14px;
  border: 1px solid #e6e7f0;
  border-radius: 8px;
  color: #5145cd;
  background: #fff;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

.pr-back-link:hover {
  background: #f3f1ff;
}

.pr-container {
  width: 100%;
  max-width: 1160px;
  padding: 30px 25px;
  margin: 0 auto;
}

.pr-hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 25px;
  min-height: 220px;
  padding: 35px clamp(22px, 4vw, 43px);
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(115deg, #4036ad, #5a4ad7 62%, #786be9);
  color: #fff;
  box-shadow: 0 10px 28px #4438bd20;
}

.pr-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 670px;
}

.pr-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #d8d3ff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.pr-eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b5ffdc;
}

.pr-hero h1 {
  margin: 17px 0 12px;
  font-size: clamp(25px, 4vw, 36px);
  line-height: 1.2;
  letter-spacing: -1.1px;
}

.pr-hero-copy > p {
  max-width: 560px;
  margin: 0;
  color: #e6e2ff;
  font-size: 13px;
  line-height: 1.8;
}

.pr-hero-note {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 21px;
  color: #e7e3ff;
  font-size: 11px;
}

.pr-hero-note span {
  font-size: 17px;
}

.pr-hero-art {
  position: relative;
  width: 170px;
  height: 170px;
  flex: 0 0 170px;
  display: grid;
  place-items: center;
}

.pr-art-ring {
  position: absolute;
  border: 1px solid #ffffff25;
  border-radius: 50%;
}

.pr-ring-one {
  width: 160px;
  height: 160px;
}

.pr-ring-two {
  width: 125px;
  height: 125px;
}

.pr-art-document {
  position: relative;
  width: 85px;
  height: 105px;
  padding: 22px 13px;
  border: 1px solid #ffffff80;
  border-radius: 12px;
  background: #ffffffed;
  box-shadow: 0 12px 30px #28207840;
  transform: rotate(-6deg);
}

.pr-art-line {
  height: 5px;
  margin-bottom: 9px;
  border-radius: 4px;
  background: #d9d7ef;
}

.pr-art-line.short {
  width: 58%;
}

.pr-art-line.medium {
  width: 75%;
}

.pr-art-check {
  position: absolute;
  top: 41px;
  right: -15px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #38bd91;
  color: #fff;
  font-size: 19px;
  font-weight: 800;
}

.pr-art-star {
  position: absolute;
  top: 14px;
  right: 12px;
  color: #ffe7a0;
  font-size: 26px;
}

.pr-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 20px;
  padding: 15px 17px;
  border: 1px solid;
  border-radius: 11px;
}

.pr-alert-success {
  border-color: #bcebd0;
  background: #f0fbf5;
  color: #176b49;
}

.pr-alert-error {
  border-color: #f2cbcb;
  background: #fff5f5;
  color: #a62f3e;
}

.pr-alert-icon {
  width: 23px;
  height: 23px;
  flex: 0 0 23px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #ffffffc9;
  font-weight: 800;
}

.pr-alert strong {
  font-size: 12px;
}

.pr-alert p {
  margin: 5px 0 0;
  line-height: 1.6;
}

.pr-alert-close {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 21px;
  cursor: pointer;
}

.pr-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
  margin-top: 22px;
}

.pr-stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
  padding: 20px;
  border: 1px solid #e9eaf2;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 3px 12px #25264b04;
}

.pr-stat-icon {
  width: 45px;
  height: 45px;
  flex: 0 0 45px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 21px;
}

.pr-stat-icon.purple {
  background: #efedff;
  color: #5145cd;
}

.pr-stat-icon.orange {
  background: #fff2df;
  color: #c17b22;
}

.pr-stat-icon.green {
  background: #e1f7ec;
  color: #16845c;
}

.pr-stat-label,
.pr-stat-card strong,
.pr-stat-card small {
  display: block;
}

.pr-stat-label {
  color: #8b91a5;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .7px;
}

.pr-stat-card strong {
  margin: 7px 0 4px;
  font-size: 27px;
  line-height: 1;
  letter-spacing: -.6px;
}

.pr-stat-card small {
  color: #858ba0;
  font-size: 10px;
  line-height: 1.5;
}

.pr-progress-panel {
  margin-top: 18px;
  padding: 22px 24px;
  border: 1px solid #e9eaf2;
  border-radius: 13px;
  background: #fff;
}

.pr-progress-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pr-progress-heading h2 {
  margin: 0;
  font-size: 14px;
}

.pr-progress-heading p {
  margin: 6px 0 0;
  color: #858ba0;
  font-size: 11px;
}

.pr-progress-percent {
  color: #5145cd;
  font-size: 23px;
}

.pr-progress-track {
  height: 8px;
  margin-top: 21px;
  overflow: hidden;
  border-radius: 20px;
  background: #efeff6;
}

.pr-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #5145cd, #887bf5);
  transition: width .3s ease;
}

.pr-progress-footer {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
  color: #8a90a3;
  font-size: 10px;
}

.pr-section {
  margin-top: 35px;
}

.pr-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 17px;
}

.pr-section-kicker {
  margin-bottom: 7px;
  color: #5145cd;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 1.3px;
}

.pr-section-heading h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: -.5px;
}

.pr-section-heading p {
  margin: 7px 0 0;
  color: #858ba0;
  font-size: 11px;
  line-height: 1.6;
}

.pr-count-badge,
.pr-completed-badge {
  padding: 8px 11px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.pr-count-badge {
  background: #fff1db;
  color: #a66a18;
}

.pr-completed-badge {
  background: #e2f8ec;
  color: #16845c;
}

.pr-review-list {
  display: grid;
  gap: 20px;
}

.pr-review-card {
  overflow: hidden;
  border: 1px solid #e5e7f0;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 4px 18px #20243a05;
}

.pr-review-card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 22px 24px;
  border-bottom: 1px solid #eff0f5;
}

.pr-review-number {
  width: 45px;
  height: 45px;
  flex: 0 0 45px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #efedff;
  color: #5145cd;
  font-size: 15px;
  font-weight: 850;
}

.pr-review-title {
  flex: 1;
  min-width: 0;
}

.pr-review-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
  color: #b57720;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: .7px;
}

.pr-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e8a23b;
}

.pr-review-title h3 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.5;
}

.pr-review-title p {
  margin: 4px 0 0;
  color: #858ba0;
  font-size: 11px;
}

.pr-max-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  padding-left: 12px;
}

.pr-max-score strong {
  font-size: 22px;
  color: #5145cd;
}

.pr-max-score span {
  color: #8b91a5;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: .6px;
}

.pr-submission {
  margin: 22px 24px;
  overflow: hidden;
  border: 1px solid #e9eaf2;
  border-radius: 11px;
}

.pr-submission-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px 16px;
  background: #fafaff;
  border-bottom: 1px solid #e9eaf2;
}

.pr-submission-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #efedff;
  color: #5145cd;
  font-size: 17px;
}

.pr-submission-heading strong,
.pr-submission-heading div span {
  display: block;
}

.pr-submission-heading strong {
  font-size: 11px;
}

.pr-submission-heading div span {
  margin-top: 4px;
  color: #858ba0;
  font-size: 10px;
}

.pr-blind-badge {
  margin-left: auto;
  padding: 6px 8px;
  border-radius: 6px;
  background: #e6f7ef;
  color: #16845c;
  font-size: 9px;
  font-weight: 750;
  white-space: nowrap;
}

.pr-submission-content {
  max-height: 360px;
  overflow: auto;
  padding: 18px;
  color: #50576c;
  font-size: 12px;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.pr-rubric-section {
  padding: 0 24px 22px;
}

.pr-rubric-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eff0f5;
}

.pr-rubric-heading h4,
.pr-overall-heading h4 {
  margin: 0;
  font-size: 14px;
}

.pr-rubric-heading p,
.pr-overall-heading p {
  margin: 6px 0 0;
  color: #858ba0;
  font-size: 10px;
}

.pr-rubric-heading > span {
  color: #777d91;
  font-size: 10px;
  white-space: nowrap;
}

.pr-criteria-list {
  display: grid;
}

.pr-criterion {
  padding: 20px 0;
  border-bottom: 1px solid #eff0f5;
}

.pr-criterion-heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
}

.pr-criterion-number {
  width: 29px;
  height: 29px;
  flex: 0 0 29px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f0efff;
  color: #5145cd;
  font-size: 11px;
  font-weight: 800;
}

.pr-criterion-title {
  min-width: 0;
  flex: 1;
}

.pr-criterion-title strong {
  display: block;
  font-size: 12px;
  line-height: 1.6;
}

.pr-criterion-title p {
  margin: 5px 0 0;
  color: #858ba0;
  font-size: 11px;
  line-height: 1.7;
}

.pr-criterion-max {
  color: #5145cd;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.pr-criterion-fields {
  display: grid;
  grid-template-columns: minmax(125px, .65fr) minmax(0, 2fr);
  gap: 15px;
  margin: 17px 0 0 40px;
}

.pr-field label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: #555c71;
  font-size: 10px;
  font-weight: 750;
}

.pr-field label span {
  color: #9a9fb0;
  font-size: 9px;
  font-weight: 500;
}

.pr-score-input-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  padding: 0 10px;
  border: 1px solid #dfe2ec;
  border-radius: 8px;
  background: #fff;
}

.pr-score-input-wrap:focus-within {
  border-color: #8176e7;
  box-shadow: 0 0 0 3px #5145cd13;
}

.pr-score-input-wrap input {
  width: 100%;
  min-width: 0;
  padding: 11px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #22243a;
  font: inherit;
}

.pr-score-input-wrap span {
  color: #8b91a5;
  font-size: 10px;
  white-space: nowrap;
}

.pr-field textarea,
.pr-overall-feedback > textarea {
  display: block;
  width: 100%;
  min-height: 75px;
  padding: 11px 12px;
  resize: vertical;
  border: 1px solid #dfe2ec;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #22243a;
  font: inherit;
  font-size: 11px;
  line-height: 1.7;
}

.pr-field textarea:focus,
.pr-overall-feedback > textarea:focus {
  border-color: #8176e7;
  box-shadow: 0 0 0 3px #5145cd13;
}

.pr-field textarea::placeholder,
.pr-overall-feedback > textarea::placeholder {
  color: #a1a6b5;
}

.pr-overall-feedback {
  margin: 0 24px;
  padding: 19px;
  border: 1px solid #e8e6ff;
  border-radius: 11px;
  background: #faf9ff;
}

.pr-overall-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 15px;
}

.pr-feedback-symbol {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #efedff;
  color: #5145cd;
  font-size: 18px;
}

.pr-overall-feedback > textarea {
  background: #fff;
  min-height: 100px;
}

.pr-character-count {
  margin-top: 7px;
  color: #9298a9;
  font-size: 9px;
  text-align: right;
}

.pr-review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-top: 22px;
  padding: 17px 24px;
  border-top: 1px solid #eff0f5;
  background: #fdfdff;
}

.pr-review-footer p {
  margin: 0;
  color: #858ba0;
  font-size: 10px;
  line-height: 1.7;
}

.pr-review-footer p span {
  margin-right: 5px;
  color: #5145cd;
}

.pr-button {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 11px 17px;
  border: 1px solid transparent;
  border-radius: 8px;
  font: inherit;
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
  transition: background .2s, transform .2s;
}

.pr-button-primary {
  background: #5145cd;
  color: #fff;
  box-shadow: 0 4px 10px #5145cd20;
}

.pr-button-primary:hover:not(:disabled) {
  background: #4035b5;
  transform: translateY(-1px);
}

.pr-button-primary:disabled {
  opacity: .6;
  cursor: not-allowed;
  transform: none;
}

.pr-button-secondary {
  margin-top: 10px;
  border-color: #dedafc;
  background: #fff;
  color: #5145cd;
}

.pr-button-spinner,
.pr-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff65;
  border-top-color: #fff;
  border-radius: 50%;
  animation: pr-spin .7s linear infinite;
}

.pr-empty {
  padding: 42px 20px;
  border: 1px dashed #dcddec;
  border-radius: 14px;
  background: #fff;
  text-align: center;
}

.pr-empty-icon {
  width: 55px;
  height: 55px;
  display: grid;
  place-items: center;
  margin: 0 auto 14px;
  border-radius: 17px;
  background: #e3f8ec;
  color: #16845c;
  font-size: 27px;
}

.pr-empty h3 {
  margin: 0;
  font-size: 16px;
}

.pr-empty p {
  max-width: 440px;
  margin: 10px auto;
  color: #858ba0;
  font-size: 11px;
  line-height: 1.8;
}

.pr-rubric-error {
  padding: 15px;
  margin-top: 15px;
  border-radius: 8px;
  background: #fff3f3;
  color: #a62f3e;
  font-size: 11px;
  line-height: 1.7;
}

.pr-completed-section {
  margin-top: 38px;
}

.pr-completed-empty {
  padding: 25px;
  border: 1px solid #e9eaf2;
  border-radius: 12px;
  background: #fff;
  color: #858ba0;
  font-size: 11px;
  text-align: center;
}

.pr-completed-list {
  display: grid;
  gap: 10px;
}

.pr-completed-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px 18px;
  border: 1px solid #e7eaf0;
  border-radius: 11px;
  background: #fff;
}

.pr-completed-icon {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #e2f8ec;
  color: #16845c;
  font-size: 16px;
  font-weight: 800;
}

.pr-completed-details {
  min-width: 0;
  flex: 1;
}

.pr-completed-details strong,
.pr-completed-details span {
  display: block;
}

.pr-completed-details strong {
  overflow-wrap: anywhere;
  font-size: 12px;
}

.pr-completed-details span {
  margin-top: 5px;
  color: #858ba0;
  font-size: 10px;
}

.pr-completed-status {
  padding: 6px 9px;
  border-radius: 20px;
  background: #e2f8ec;
  color: #16845c;
  font-size: 9px;
  font-weight: 750;
}

.pr-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 35px;
  padding: 20px 0 8px;
  border-top: 1px solid #e8eaf2;
  color: #969bad;
  font-size: 10px;
}

.pr-footer strong {
  color: #5145cd;
}

.pr-loading {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f6f7fc;
  font-family: Inter, "Segoe UI", sans-serif;
}

.pr-spinner {
  width: 30px;
  height: 30px;
  border-color: #dedafc;
  border-top-color: #5145cd;
}

.pr-loading h3 {
  margin: 17px 0 5px;
  color: #22243a;
  font-size: 15px;
}

.pr-loading p {
  color: #858ba0;
  font-size: 11px;
}

@keyframes pr-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .pr-container {
    padding: 20px 13px;
  }

  .pr-hero {
    min-height: auto;
    padding: 27px 22px;
  }

  .pr-hero-art {
    display: none;
  }

  .pr-stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .pr-stat-card {
    padding: 15px;
  }

  .pr-stat-card strong {
    font-size: 23px;
  }

  .pr-progress-panel {
    padding: 18px;
  }

  .pr-section-heading {
    align-items: flex-start;
  }

  .pr-section-heading h2 {
    font-size: 18px;
  }

  .pr-review-card-header {
    padding: 17px;
    gap: 10px;
  }

  .pr-review-number {
    width: 37px;
    height: 37px;
    flex-basis: 37px;
  }

  .pr-review-title h3 {
    font-size: 13px;
  }

  .pr-max-score strong {
    font-size: 18px;
  }

  .pr-submission {
    margin: 16px;
  }

  .pr-submission-heading {
    flex-wrap: wrap;
    padding: 12px;
  }

  .pr-blind-badge {
    margin-left: 45px;
  }

  .pr-rubric-section {
    padding: 0 16px 17px;
  }

  .pr-criterion-fields {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-left: 0;
  }

  .pr-criterion-max {
    font-size: 9px;
  }

  .pr-overall-feedback {
    margin: 0 16px;
    padding: 14px;
  }

  .pr-review-footer {
    align-items: stretch;
    flex-direction: column;
    padding: 16px;
  }

  .pr-review-footer .pr-button {
    width: 100%;
  }

  .pr-footer {
    flex-wrap: wrap;
  }
}

@media (max-width: 420px) {
  .pr-topbar {
    padding: 12px;
  }

  .pr-brand strong {
    font-size: 15px;
  }

  .pr-back-link {
    padding: 9px;
    font-size: 10px;
  }

  .pr-review-card-header {
    align-items: flex-start;
  }

  .pr-review-number {
    display: none;
  }

  .pr-review-tag {
    font-size: 8px;
  }

  .pr-count-badge,
  .pr-completed-badge {
    font-size: 9px;
  }

  .pr-criterion-heading {
    flex-wrap: wrap;
  }

  .pr-criterion-max {
    margin-left: 40px;
  }
}
`;
