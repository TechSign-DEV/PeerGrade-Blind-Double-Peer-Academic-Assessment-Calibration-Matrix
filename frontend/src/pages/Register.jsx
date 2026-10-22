
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      };

      await api.post("/auth/register", payload);

      setSuccess(
        "Registration successful! Redirecting to login..."
      );

      // Do not store a token or log the user in automatically.
      // Redirect to login after successful registration.
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registered: true,
            email: payload.email,
          },
        });
      }, 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    marginTop: "6px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "15px",
    outlineColor: "#4f46e5",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        background: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "430px",
          padding: "32px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          display: "grid",
          gap: "18px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              marginBottom: "8px",
              color: "#4338ca",
              fontSize: "32px",
            }}
          >
            PeerGrade
          </h1>

          <p style={{ color: "#6b7280", marginTop: 0 }}>
            Create your account
          </p>
        </div>

        <label>
          Full name
          <input
            style={inputStyle}
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />
        </label>

        <label>
          Email address
          <input
            style={inputStyle}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </label>

        <label>
          Password
          <input
            style={inputStyle}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 8 characters"
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Register as
          <select
            style={inputStyle}
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px",
              color: "#b91c1c",
              background: "#fef2f2",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              padding: "12px",
              color: "#166534",
              background: "#f0fdf4",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "13px",
            border: "none",
            borderRadius: "8px",
            background: loading ? "#818cf8" : "#4338ca",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: 0,
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#4338ca",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
