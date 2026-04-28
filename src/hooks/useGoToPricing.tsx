import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Navigate to /pricing while remembering where the user came from,
 * so the Pricing page's Back button can return them there.
 */
export function useGoToPricing() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const from = location.pathname + location.search;
    navigate("/pricing", { state: { from } });
  }, [navigate, location.pathname, location.search]);
}