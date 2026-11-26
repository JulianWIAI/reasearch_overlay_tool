import { HOST_ID, mountResearchOverlay } from "./app.js";

(() => {
  const existingHost = document.getElementById(HOST_ID);
  if (existingHost?.__researchOverlayController) {
    existingHost.__researchOverlayController.toggle();
    return;
  }

  mountResearchOverlay();
})();
