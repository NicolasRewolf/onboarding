import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles/globals.css";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import OffreStarter from "./offres/OffreStarter";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:slug" element={<Onboarding />} />
        <Route path="/offre-starter" element={<OffreStarter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
