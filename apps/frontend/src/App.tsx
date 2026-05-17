import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route index element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
