import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/utils/analytics";

// Tracks GA4 page_view on SPA route changes
export const usePageView = () => {
  const location = useLocation();

  useEffect(() => {
    const pagePath = location.pathname + (location.search || "");
    trackEvent("page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }, [location.pathname, location.search]);
};
