import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initCooked, trackPageview } from "./cooked";

/**
 * Monte le traceur cooked et émet un pageview à chaque changement de route SPA.
 * À placer une seule fois, à l'intérieur de <BrowserRouter>.
 */
export default function CookedTracker() {
  const location = useLocation();

  useEffect(() => {
    initCooked();
  }, []);

  useEffect(() => {
    trackPageview();
    // pathname seul : on n'émet pas un nouveau pageview sur un simple changement
    // de query/hash (cooked canonicalise sans query).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}
