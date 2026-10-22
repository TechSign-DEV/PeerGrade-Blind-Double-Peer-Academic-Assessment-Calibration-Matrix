
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateAssignment from "./pages/CreateAssignment";
import StudentAssignments from "./pages/StudentAssignments";
import PeerReview from "./pages/PeerReview";
import CalibrationDashboard from "./pages/CalibrationDashboard";
import StudentResults from "./pages/StudentResults";
import AdminDashboard from "./pages/AdminDashboard";
import InstructorGrades from "./pages/InstructorGrades";

// Basic frontend route protection
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("peergrade_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Main dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Assignment routes */}
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <StudentAssignments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignments/create"
          element={
            <ProtectedRoute>
              <CreateAssignment />
            </ProtectedRoute>
          }
        />

        {/* Peer review */}
        <Route
          path="/peer-reviews"
          element={
            <ProtectedRoute>
              <PeerReview />
            </ProtectedRoute>
          }
        />

        {/* Instructor calibration */}
        <Route
          path="/calibration"
          element={
            <ProtectedRoute>
              <CalibrationDashboard />
            </ProtectedRoute>
          }
        />

        {/* NEW: Instructor Grade Management */}
        <Route
          path="/instructor/grades"
          element={
            <ProtectedRoute>
              <InstructorGrades />
            </ProtectedRoute>
          }
        />

        {/* Student results */}
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <StudentResults />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
