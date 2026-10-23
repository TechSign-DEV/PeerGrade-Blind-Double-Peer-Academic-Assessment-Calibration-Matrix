
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
  Users,
  AlertCircle,
  Layers3,
} from "lucide-react";
import api from "../services/api";
import "./CreateAssignment.css";

const initialForm = {
  title: "",
  description: "",
  courseName: "",
  deadline: "",
  maxMarks: "100",
};

const initialCriteria = [
  { criterion: "Content quality", maxMarks: "40" },
  { criterion: "Originality", maxMarks: "30" },
  { criterion: "Presentation", maxMarks: "30" },
];

export default function CreateAssignment() {
  const [form, setForm] = useState(initialForm);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [assignments, setAssignments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const rubricTotal = useMemo(
    () =>
      criteria.reduce(
        (sum, item) => sum + Number(item.maxMarks || 0),
        0
      ),
    [criteria]
  );

  const maxMarks = Number(form.maxMarks);
  const rubricMatches =
    Number.isFinite(maxMarks) && Math.abs(rubricTotal - maxMarks) < 0.000001;

  const fetchAssignments = useCallback(async () => {
    setLoadingList(true);
    setListError("");

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
      setListError(
        err.response?.data?.message ||
          "Could not load your assignments. Please try again."
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const updateForm = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage("");
    setError("");
  };

  const updateCriterion = (index, field, value) => {
    setCriteria((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
    setMessage("");
    setError("");
  };

  const addCriterion = () => {
    setCriteria((previous) => [
      ...previous,
      { criterion: "", maxMarks: "1" },
    ]);
  };

  const removeCriterion = (index) => {
    setCriteria((previous) => previous.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const totalMarks = Number(form.maxMarks);

    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      setError("Maximum marks must be greater than zero.");
      return;
    }

    if (!form.deadline) {
      setError("Please select a submission deadline.");
      return;
    }

    const deadlineDate = new Date(form.deadline);

    if (
      Number.isNaN(deadlineDate.getTime()) ||
      deadlineDate <= new Date()
    ) {
      setError("The deadline must be in the future.");
      return;
    }

    const rubric = criteria.map((item) => ({
      criterion: item.criterion.trim(),
      maxMarks: Number(item.maxMarks),
    }));

    if (
      rubric.length === 0 ||
      rubric.some(
        (item) =>
          !item.criterion ||
          !Number.isFinite(item.maxMarks) ||
          item.maxMarks <= 0
      )
    ) {
      setError("Enter a criterion name and positive marks for every row.");
      return;
    }

    const calculatedTotal = rubric.reduce(
      (sum, item) => sum + item.maxMarks,
      0
    );

    if (Math.abs(calculatedTotal - totalMarks) > 0.000001) {
      setError("Rubric marks must equal the assignment maximum.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/assignments", {
        ...form,
        maxMarks: totalMarks,
        rubric,
        deadline: deadlineDate.toISOString(),
      });

      setMessage("Assignment created successfully!");
      setForm(initialForm);
      setCriteria(initialCriteria);
      await fetchAssignments();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create assignment."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not specified";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "Not specified";

    return parsed.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatus = (assignment) => {
    if (assignment.status) return assignment.status;
    if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
      return "CLOSED";
    }
    return "PUBLISHED";
  };

  return (
    <div className="ca-page">
      <header className="ca-topbar">
        <Link to="/dashboard" className="ca-brand">
          <span className="ca-brand-icon">
            <BookOpen size={22} />
          </span>
          <span>
            <strong>PeerGrade</strong>
            <small>Academic assessment</small>
          </span>
        </Link>

        <Link to="/dashboard" className="ca-back-link">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>
      </header>

      <main className="ca-main">
        <section className="ca-heading">
          <div>
            <span className="ca-eyebrow">INSTRUCTOR WORKSPACE</span>
            <h1>Create an assignment</h1>
            <p>
              Set up coursework, define your grading criteria, and give
              students a clear path to success.
            </p>
          </div>

          <div className="ca-heading-icon">
            <ClipboardList size={30} />
          </div>
        </section>

        <section className="ca-stats">
          <article className="ca-stat-card">
            <span className="ca-stat-icon purple">
              <Layers3 size={20} />
            </span>
            <div>
              <span className="ca-stat-label">Your assignments</span>
              <strong>{assignments.length}</strong>
            </div>
          </article>

          <article className="ca-stat-card">
            <span className="ca-stat-icon blue">
              <Trophy size={20} />
            </span>
            <div>
              <span className="ca-stat-label">Maximum marks</span>
              <strong>{maxMarks > 0 ? maxMarks : "—"}</strong>
            </div>
          </article>

          <article className="ca-stat-card">
            <span className="ca-stat-icon green">
              <CheckCircle2 size={20} />
            </span>
            <div>
              <span className="ca-stat-label">Rubric status</span>
              <strong className="ca-stat-status">
                {rubricMatches ? "Balanced" : "Needs adjustment"}
              </strong>
            </div>
          </article>
        </section>

        <form className="ca-form-card" onSubmit={handleSubmit}>
          <div className="ca-section-heading">
            <span className="ca-section-icon">
              <FileText size={20} />
            </span>
            <div>
              <h2>Assignment details</h2>
              <p>Start with the basic information students need.</p>
            </div>
          </div>

          <div className="ca-form-grid">
            <label className="ca-field">
              <span>Assignment title <b>*</b></span>
              <input
                name="title"
                value={form.title}
                onChange={updateForm}
                placeholder="e.g. Java OOP mini project"
                required
              />
            </label>

            <label className="ca-field">
              <span>Course name <b>*</b></span>
              <input
                name="courseName"
                value={form.courseName}
                onChange={updateForm}
                placeholder="e.g. Advanced Java"
                required
              />
            </label>

            <label className="ca-field ca-field-full">
              <span>Description <b>*</b></span>
              <textarea
                name="description"
                value={form.description}
                onChange={updateForm}
                placeholder="Describe the task, expectations, and submission instructions..."
                rows={4}
                required
              />
              <small>Give students enough detail to understand the task.</small>
            </label>

            <label className="ca-field">
              <span>Submission deadline <b>*</b></span>
              <div className="ca-input-with-icon">
                <CalendarDays size={18} />
                <input
                  type="datetime-local"
                  name="deadline"
                  value={form.deadline}
                  onChange={updateForm}
                  required
                />
              </div>
              <small>Choose a future date and time.</small>
            </label>

            <label className="ca-field">
              <span>Total possible marks <b>*</b></span>
              <div className="ca-input-with-icon">
                <Trophy size={18} />
                <input
                  type="number"
                  name="maxMarks"
                  min="1"
                  step="any"
                  value={form.maxMarks}
                  onChange={updateForm}
                  required
                />
              </div>
              <small>All rubric criteria must add up to this value.</small>
            </label>
          </div>

          <div className="ca-divider" />

          <div className="ca-section-heading ca-rubric-heading">
            <span className="ca-section-icon">
              <Trophy size={20} />
            </span>
            <div>
              <h2>Grading rubric</h2>
              <p>Tell reviewers how to assess the submitted work.</p>
            </div>
            <button
              type="button"
              className="ca-secondary-button"
              onClick={addCriterion}
            >
              <Plus size={17} />
              Add criterion
            </button>
          </div>

          <div className="ca-rubric">
            <div className="ca-rubric-header">
              <span>CRITERION</span>
              <span>MAXIMUM MARKS</span>
              <span />
            </div>

            {criteria.map((item, index) => (
              <div className="ca-rubric-row" key={index}>
                <label className="ca-field">
                  <span className="ca-mobile-label">Criterion name</span>
                  <input
                    value={item.criterion}
                    onChange={(e) =>
                      updateCriterion(index, "criterion", e.target.value)
                    }
                    placeholder="e.g. Code quality"
                    required
                  />
                </label>

                <label className="ca-field">
                  <span className="ca-mobile-label">Maximum marks</span>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={item.maxMarks}
                    onChange={(e) =>
                      updateCriterion(index, "maxMarks", e.target.value)
                    }
                    required
                  />
                </label>

                <button
                  type="button"
                  className="ca-remove-button"
                  onClick={() => removeCriterion(index)}
                  disabled={criteria.length === 1}
                  aria-label={`Remove criterion ${index + 1}`}
                  title="Remove criterion"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>

          <div className={`ca-rubric-total ${rubricMatches ? "is-valid" : "is-invalid"}`}>
            <div>
              <span className="ca-total-icon">
                {rubricMatches ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <AlertCircle size={19} />
                )}
              </span>
              <div>
                <strong>{rubricMatches ? "Rubric is balanced" : "Marks don't match yet"}</strong>
                <small>
                  {rubricMatches
                    ? "Your criteria match the assignment's total marks."
                    : "Adjust the criteria so their marks equal the assignment total."}
                </small>
              </div>
            </div>

            <strong className="ca-total-number">
              {rubricTotal} <span>/ {form.maxMarks || 0}</span>
            </strong>
          </div>

          {message && (
            <div className="ca-alert success">
              <CheckCircle2 size={19} />
              {message}
            </div>
          )}

          {error && (
            <div className="ca-alert error">
              <AlertCircle size={19} />
              {error}
            </div>
          )}

          <div className="ca-form-footer">
            <p>
              <Users size={16} />
              Students will use this rubric during peer review.
            </p>
            <button className="ca-primary-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={18} className="ca-spin" />
                  Creating assignment...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Create assignment
                </>
              )}
            </button>
          </div>
        </form>

        <section className="ca-assignments-section">
          <div className="ca-section-heading ca-list-heading">
            <span className="ca-section-icon">
              <BookOpen size={20} />
            </span>
            <div>
              <h2>Your assignments</h2>
              <p>Review the assignments you've created.</p>
            </div>
            <button
              className="ca-refresh-button"
              type="button"
              onClick={fetchAssignments}
              disabled={loadingList}
            >
              <RefreshCw size={16} className={loadingList ? "ca-spin" : ""} />
              Refresh
            </button>
          </div>

          {listError && (
            <div className="ca-alert error">
              <AlertCircle size={19} />
              {listError}
            </div>
          )}

          {loadingList ? (
            <div className="ca-empty-state">
              <RefreshCw size={25} className="ca-spin" />
              <p>Loading your assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="ca-empty-state">
              <span className="ca-empty-icon">
                <ClipboardList size={27} />
              </span>
              <h3>No assignments yet</h3>
              <p>Create your first assignment using the form above.</p>
            </div>
          ) : (
            <div className="ca-assignment-grid">
              {assignments.map((assignment) => {
                const status = getStatus(assignment);

                return (
                  <article className="ca-assignment-card" key={assignment._id}>
                    <div className="ca-assignment-card-top">
                      <span className="ca-assignment-icon">
                        <BookOpen size={20} />
                      </span>
                      <span
                        className={`ca-status ${
                          String(status).toUpperCase() === "CLOSED"
                            ? "closed"
                            : "published"
                        }`}
                      >
                        {String(status).replaceAll("_", " ")}
                      </span>
                    </div>

                    <h3>{assignment.title}</h3>
                    <p className="ca-assignment-course">
                      {assignment.courseName || "Course not specified"}
                    </p>
                    <p className="ca-assignment-description">
                      {assignment.description || "No description provided."}
                    </p>

                    <div className="ca-assignment-meta">
                      <span>
                        <Trophy size={16} />
                        {assignment.maxMarks} marks
                      </span>
                      <span>
                        <Clock3 size={16} />
                        {formatDate(assignment.deadline)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
