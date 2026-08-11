import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles/globals.css";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import OffreStarter from "./offres/OffreStarter";
import ReelsVote from "./reels/ReelsVote";
import ArticlesBoard from "./articles/ArticlesBoard";
import DispoParticipant from "./dispos/DispoParticipant";
import DispoRecap from "./dispos/DispoRecap";
import Avocats from "./avocats/Avocats";
import SiteInternet from "./avocats/SiteInternet";
import Cremaillere from "./cremaillere/Cremaillere";
import { Confidentialite, MentionsLegales } from "./legal/Legal";
import ConsentBanner from "./consent/ConsentBanner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/c/:slug" element={<Onboarding />} />
        <Route path="/forfaits-flash" element={<OffreStarter />} />
        <Route path="/reels/:slug" element={<ReelsVote />} />
        <Route path="/articles/:slug" element={<ArticlesBoard />} />
        <Route path="/dispo/:slug" element={<DispoParticipant />} />
        <Route path="/dispo/:slug/recap" element={<DispoRecap />} />
        <Route path="/avocats" element={<Avocats />} />
        <Route path="/avocats/site-internet" element={<SiteInternet />} />
        <Route path="/cremaillere" element={<Cremaillere />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ConsentBanner />
    </BrowserRouter>
  );
}
