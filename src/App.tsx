import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles/globals.css";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Onboarding from "./pages/Onboarding";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/c/:slug" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
