export const UNAUTHORIZED_EVENT = "zayanmax:unauthorized";

export function notifyUnauthorizedSession() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
}
