
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./StudentResults.css";

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function ResultCard({ grade }) {
  const assignment = grade.assignment || {};
  const submission = grade.submission || {};
  const maxMarks = Number(grade.maxMarks || assignment.maxMarks || 0);
  const marks = Number(grade.calculatedMarks || 0);
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;

  return (
    <article className="result-card">
      <div className="result-card-top">
        <div>
          <p className="result-course">
            {assignment.courseName || "Course"}
          </p>
          <h2>{assignment.title || "Assignment result"}</h2>
          <p className="result-muted">
            Submitted: {formatDate(submission.submittedAt)}
          </p>
        </div>

        <span className="result-status">Grade released</span>
      </div>

      <div className="result-score-area">
        <div>
          <p className="result-muted">Your score</p>
          <p className="result-score">
            {marks.toFixed(2)}
            <span> / {maxMarks.toFixed(2)}</span>
          </p>
        </div>

        <div className="result-percentage">
          <strong>{percentage.toFixed(1)}%</strong>
          <span>of total marks</span>
        </div>
      </div>

      <div
        className="result-progress-track"
        role="progressbar"
        aria-label="Percentage of marks obtained"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.max(0, Math.min(100, percentage)))}
      >
        <div
          className="result-progress"
          style={{
            width: `${Math.max(0, Math.min(100, percentage))}%`
          }}
        />
      </div>

      <div className="result-details">
        <div>
          <span>Peer reviews considered</span>
          <strong>{grade.peerReviewCount ?? "—"}</strong>
        </div>

        <div>
          <span>Released on</span>
          <strong>{formatDate(grade.releasedAt)}</strong>
        </div>
      </div>

      {grade.instructorFeedback?.trim() ? (
        <section className="result-feedback">
          <h3>
            <span aria-hidden="true">✦</span> Instructor feedback
          </h3>
          <p>{grade.instructorFeedback}</p>
        </section>
      ) : (
        <section className="result-feedback result-feedback-empty">
          <h3>Instructor feedback</h3>
          <p>No written feedback was provided for this grade.</p>
        </section>
      )}
    </article>
  );
}

export default function StudentResults() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGrades() {
      try {
        const response = await api.get("/grades/mine");

        if (!active) return;

        const items = response.data.grades;

        setGrades(Array.isArray(items) ? items : []);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.message ||
          "Could not load your results. Please try again."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadGrades();

    return () => {
      active = false;
    };
  }, []);

  const totalReleased = grades.length;

  const totalMarks = grades.reduce(
    (sum, grade) => sum + Number(grade.calculatedMarks || 0),
    0
  );

  const totalMaximum = grades.reduce(
    (sum, grade) => sum + Number(grade.maxMarks || 0),
    0
  );

  const overallPercentage =
    totalMaximum > 0 ? (totalMarks / totalMaximum) * 100 : 0;

  return (
    <main className="results-page">
      <header className="results-header">
        <div>
          <p className="results-eyebrow">PEERGRADE / STUDENT PORTAL</p>
          <h1>My results</h1>
          <p>
            View your released assignment grades and instructor feedback.
          </p>
        </div>

        <Link to="/dashboard" className="results-back">
          Back to dashboard
        </Link>
      </header>

      {loading ? (
        <div className="results-state">Loading your results...</div>
      ) : error ? (
        <div className="results-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="results-summary">
            <div className="results-summary-card">
              <span>Released assignments</span>
              <strong>{totalReleased}</strong>
            </div>

            <div className="results-summary-card">
              <span>Total marks earned</span>
              <strong>{totalMarks.toFixed(2)}</strong>
            </div>

            <div className="results-summary-card">
              <span>Total possible marks</span>
              <strong>{totalMaximum.toFixed(2)}</strong>
            </div>

            <div className="results-summary-card">
              <span>Combined percentage</span>
              <strong>
                {totalMaximum > 0
                  ? `${overallPercentage.toFixed(1)}%`
                  : "—"}
              </strong>
            </div>
          </section>

          {grades.length === 0 ? (
            <section className="results-empty">
              <div className="results-empty-icon" aria-hidden="true">
                ✓
              </div>
              <h2>No released grades yet</h2>
              <p>
                Your results will appear here after your instructor
                calculates, reviews, and releases your grades.
              </p>
              <Link to="/assignments" className="results-primary-link">
                View assignments
              </Link>
            </section>
          ) : (
            <section className="results-list">
              <div className="results-list-heading">
                <h2>Released grades</h2>
                <span>{grades.length} result(s)</span>
              </div>

              {grades.map((grade) => (
                <ResultCard key={grade._id} grade={grade} />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
