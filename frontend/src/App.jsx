
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
import AppLayout from "./components/AppLayout";

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
        {/* Public routes */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Shared authenticated layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assignments" element={<StudentAssignments />} />
          <Route
            path="/assignments/create"
            element={<CreateAssignment />}
          />
          <Route path="/peer-reviews" element={<PeerReview />} />
          <Route
            path="/calibration"
            element={<CalibrationDashboard />}
          />
          <Route
            path="/instructor/grades"
            element={<InstructorGrades />}
          />
          <Route path="/results" element={<StudentResults />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
