
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./CalibrationDashboard.css";
const signalLabels = {
  TENDS_HIGHER: "Tends to score higher",
  TENDS_LOWER: "Tends to score lower",
  WITHIN_RANGE: "Within range",
  INSUFFICIENT_DATA: "Insufficient data"
};

function formatNumber(value) {
  return value == null ? "—" : Number(value).toFixed(2);
}

function Metric({ label, value, description }) {
  return (
    <div className="cal-metric">
      <p className="cal-muted">{label}</p>
      <h2>{value}</h2>
      <p className="cal-muted cal-small">{description}</p>
    </div>
  );
}

export default function CalibrationDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState("");
  const [report, setReport] = useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      try {
        setError("");
        const response = await api.get("/assignments/mine");

        if (!active) return;

        const items = Array.isArray(response.data)
          ? response.data
          : response.data.assignments || [];

        setAssignments(items);

        if (items.length > 0) {
          setAssignmentId(String(items[0]._id || items[0].id));
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Could not load your assignments."
          );
        }
      } finally {
        if (active) setLoadingAssignments(false);
      }
    }

    loadAssignments();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!assignmentId) {
      setReport(null);
      return;
    }

    let active = true;

    async function loadReport() {
      setLoadingReport(true);
      setError("");
      setReport(null);

      try {
        const response = await api.get(
          `/reviews/calibration/${assignmentId}`
        );

        if (active) setReport(response.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Could not load the calibration report."
          );
        }
      } finally {
        if (active) setLoadingReport(false);
      }
    }

    loadReport();

    return () => {
      active = false;
    };
  }, [assignmentId]);

  if (loadingAssignments) {
    return <main className="cal-page">Loading your assignments...</main>;
  }

  return (
    <main className="cal-page">
      <header className="cal-header">
        <div>
          <p className="cal-eyebrow">PEERGRADE / INSTRUCTOR TOOLS</p>
          <h1>Calibration dashboard</h1>
          <p className="cal-muted">
            Review score agreement and grading patterns across your assignments.
          </p>
        </div>

        <Link to="/dashboard" className="cal-back">
          Back to dashboard
        </Link>
      </header>

      <section className="cal-panel">
        <label htmlFor="cal-assignment">Select an assignment</label>

        <select
          id="cal-assignment"
          value={assignmentId}
          onChange={(event) => setAssignmentId(event.target.value)}
          disabled={assignments.length === 0}
        >
          {assignments.map((assignment) => (
            <option
              key={assignment._id || assignment.id}
              value={assignment._id || assignment.id}
            >
              {assignment.title}
            </option>
          ))}
        </select>

        {assignments.length === 0 && !error && (
          <p className="cal-muted">
            You have not created any assignments yet.
          </p>
        )}
      </section>

      {error && (
        <div className="cal-error" role="alert">
          {error}
        </div>
      )}

      {loadingReport && (
        <section className="cal-panel">Loading calibration results...</section>
      )}

      {!loadingReport && report && (
        <>
          <section className="cal-metrics">
            <Metric
              label="Completed reviews"
              value={report.summary.completedPeerReviews}
              description="Usable peer reviews"
            />
            <Metric
              label="Submissions reviewed"
              value={report.summary.submissionsReviewed}
              description="With at least one usable review"
            />
            <Metric
              label="Reviewers included"
              value={report.summary.reviewersIncluded}
              description="With completed reviews"
            />
            <Metric
              label="Maximum marks"
              value={report.assignment.maxMarks}
              description="Assignment total"
            />
          </section>

          <section className="cal-panel">
            <h2>Submission score agreement</h2>
            <p className="cal-muted">
              Percentages are normalized to each review's rubric maximum.
              Higher standard deviation means greater disagreement between reviewers.
            </p>

            {report.submissions.length === 0 ? (
              <p>No completed peer reviews are available yet.</p>
            ) : (
              <div className="cal-table-wrap">
                <table className="cal-table">
                  <thead>
                    <tr>
                      <th>Submission</th>
                      <th>Reviews</th>
                      <th>Average</th>
                      <th>Lowest</th>
                      <th>Highest</th>
                      <th>Std. deviation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.submissions.map((item) => (
                      <tr key={item.submissionId}>
                        <td>
                          <span className="cal-id">
                            {item.submissionId.slice(-8)}
                          </span>
                        </td>
                        <td>{item.completedReviewCount}</td>
                        <td>
                          <strong>{formatNumber(item.averagePercentage)}%</strong>
                          <div className="cal-bar-track">
                            <div
                              className="cal-bar"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(100, item.averagePercentage)
                                )}%`
                              }}
                            />
                          </div>
                          <span className="cal-muted cal-small">
                            {formatNumber(item.averageMarks)} marks
                          </span>
                        </td>
                        <td>{formatNumber(item.lowestPercentage)}%</td>
                        <td>{formatNumber(item.highestPercentage)}%</td>
                        <td>{formatNumber(item.standardDeviationPoints)} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="cal-panel">
            <h2>Reviewer calibration</h2>
            <p className="cal-muted">
              Deviation is measured in percentage points relative to the other
              completed reviews for the same submission. A signal is shown only
              after the reviewer has completed at least five reviews.
            </p>

            {report.reviewers.length === 0 ? (
              <p>No reviewer statistics are available yet.</p>
            ) : (
              <div className="cal-table-wrap">
                <table className="cal-table">
                  <thead>
                    <tr>
                      <th>Reviewer</th>
                      <th>Completed reviews</th>
                      <th>Average deviation</th>
                      <th>Calibration signal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.reviewers.map((reviewer) => (
                      <tr key={reviewer.reviewerId}>
                        <td>
                          <strong>{reviewer.reviewerName}</strong>
                          <div className="cal-muted cal-small">
                            {reviewer.reviewerEmail}
                          </div>
                        </td>
                        <td>{reviewer.completedReviews}</td>
                        <td>
                          {reviewer.averageDeviationPoints == null
                            ? "—"
                            : `${reviewer.averageDeviationPoints > 0 ? "+" : ""}${reviewer.averageDeviationPoints} pts`}
                        </td>
                        <td>
                          <span className={`cal-signal cal-${reviewer.calibrationSignal.toLowerCase()}`}>
                            {signalLabels[reviewer.calibrationSignal] ||
                              reviewer.calibrationSignal}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="cal-notice">
            <strong>Interpret results carefully</strong>
            <p>
              Calibration signals are prompts for instructor review, not proof
              of bias or misconduct. Differences can reflect rubric interpretation,
              assignment difficulty, and the small number of available reviews.
              Use instructor-verified scores for stronger calibration.
            </p>
          </section>
        </>
      )}
    </main>
  );
}
