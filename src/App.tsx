import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles/globals.css";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import OffreStarter from "./offres/OffreStarter";
import ReelsVote from "./reels/ReelsVote";
import DispoParticipant from "./dispos/DispoParticipant";
import DispoRecap from "./dispos/DispoRecap";
import CookedTracker from "./tracking/CookedTracker";

export default function App() {
  return (
    <BrowserRouter>
      <CookedTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:slug" element={<Onboarding />} />
        <Route path="/forfaits-flash" element={<OffreStarter />} />
        <Route path="/reels/:slug" element={<ReelsVote />} />
        <Route path="/dispo/:slug" element={<DispoParticipant />} />
        <Route path="/dispo/:slug/recap" element={<DispoRecap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
