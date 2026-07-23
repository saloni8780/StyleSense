import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing   from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { getStoredUser } from "./api";

function RequireAuth({ children }) {
  const user    = getStoredUser();
  const isGuest = localStorage.getItem("ss_guest") === "true";
  if (!user && !isGuest) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"    element={<Landing />} />
        <Route path="/app" element={
          <RequireAuth><Dashboard /></RequireAuth>
        } />
        <Route path="*"    element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}