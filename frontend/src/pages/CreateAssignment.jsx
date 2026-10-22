
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const initialForm = {
  title: "",
  description: "",
  courseName: "",
  deadline: "",
  maxMarks: 100,
};

const initialCriteria = [
  { criterion: "Content quality", maxMarks: 40 },
  { criterion: "Originality", maxMarks: 30 },
  { criterion: "Presentation", maxMarks: 30 },
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
          "Could not load your assignments."
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
  };

  const updateCriterion = (index, field, value) => {
    setCriteria((previous) =>
      previous.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addCriterion = () => {
    setCriteria((previous) => [
      ...previous,
      { criterion: "", maxMarks: 1 },
    ]);
  };

  const removeCriterion = (index) => {
    setCriteria((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const maxMarks = Number(form.maxMarks);

    if (!Number.isFinite(maxMarks) || maxMarks <= 0) {
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
      setError(
        "Enter a valid name and positive marks for every criterion."
      );
      return;
    }

    const rubricTotal = rubric.reduce(
      (sum, item) => sum + item.maxMarks,
      0
    );

    if (Math.abs(rubricTotal - maxMarks) > 0.000001) {
      setError("Rubric marks must equal the assignment maximum.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/assignments", {
        ...form,
        maxMarks,
        rubric,
        deadline: deadlineDate.toISOString(),
      });

      setMessage("Assignment created successfully!");
      setForm(initialForm);
      setCriteria(initialCriteria);

      await fetchAssignments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create assignment."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "35px auto",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <h1>Create Assignment</h1>
      <p>Configure the assignment and grading rubric.</p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "18px",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "22px",
          background: "#fff",
        }}
      >
        <label>
          Assignment title
          <input
            style={inputStyle}
            name="title"
            value={form.title}
            onChange={updateForm}
            required
          />
        </label>

        <label>
          Description
          <textarea
            style={inputStyle}
            name="description"
            value={form.description}
            onChange={updateForm}
            rows={4}
            required
          />
        </label>

        <label>
          Course name
          <input
            style={inputStyle}
            name="courseName"
            value={form.courseName}
            onChange={updateForm}
            required
          />
        </label>

        <label>
          Submission deadline
          <input
            style={inputStyle}
            type="datetime-local"
            name="deadline"
            value={form.deadline}
            onChange={updateForm}
            min={new Date(Date.now() + 60000)
              .toISOString()
              .slice(0, 16)}
            required
          />
        </label>

        <label>
          Maximum marks
          <input
            style={inputStyle}
            type="number"
            name="maxMarks"
            min="1"
            value={form.maxMarks}
            onChange={(e) => {
              updateForm(e);
              setCriteria((previous) =>
                previous.length === 3
                  ? [
                      {
                        ...previous[0],
                        maxMarks: Number(e.target.value) * 0.4,
                      },
                      {
                        ...previous[1],
                        maxMarks: Number(e.target.value) * 0.3,
                      },
                      {
                        ...previous[2],
                        maxMarks: Number(e.target.value) * 0.3,
                      },
                    ]
                  : previous
              );
            }}
            required
          />
        </label>

        <section>
          <h2>Grading rubric</h2>

          {criteria.map((item, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr auto",
                gap: "10px",
                marginBottom: "12px",
                alignItems: "end",
              }}
            >
              <label>
                Criterion
                <input
                  style={inputStyle}
                  value={item.criterion}
                  onChange={(e) =>
                    updateCriterion(
                      index,
                      "criterion",
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                Marks
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  step="any"
                  value={item.maxMarks}
                  onChange={(e) =>
                    updateCriterion(
                      index,
                      "maxMarks",
                      e.target.value
                    )
                  }
                  required
                />
              </label>

              <button
                type="button"
                onClick={() => removeCriterion(index)}
                disabled={criteria.length === 1}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" onClick={addCriterion}>
            + Add criterion
          </button>

          <p>
            Total rubric marks:{" "}
            {criteria.reduce(
              (sum, item) => sum + Number(item.maxMarks || 0),
              0
            )}{" "}
            / {form.maxMarks}
          </p>
        </section>

        {message && (
          <p style={{ color: "green" }}>{message}</p>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Assignment"}
        </button>
      </form>

      <section style={{ marginTop: "36px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <h2>My Assignments</h2>
          <button
            type="button"
            onClick={fetchAssignments}
            disabled={loadingList}
          >
            {loadingList ? "Loading..." : "Refresh"}
          </button>
        </div>

        {listError && (
          <div style={{ color: "#b91c1c", margin: "12px 0" }}>
            {listError}
          </div>
        )}

        {loadingList ? (
          <p>Loading your assignments...</p>
        ) : assignments.length === 0 ? (
          <p>No assignments found for your instructor account.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {assignments.map((assignment) => (
              <article
                key={assignment._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "18px",
                  background: "#fff",
                }}
              >
                <h3>{assignment.title}</h3>
                <p>
                  <strong>Course:</strong>{" "}
                  {assignment.courseName}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {assignment.description}
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
                <p>
                  <strong>Status:</strong>{" "}
                  {assignment.status || "PUBLISHED"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
