const RESTRICTED_PROTOCOLS = new Set([
  "chrome:",
  "chrome-extension:",
  "edge:",
  "about:",
  "view-source:",
  "devtools:"
]);

function canInject(tab) {
  if (!tab?.id || !tab.url) return false;
  try {
    return !RESTRICTED_PROTOCOLS.has(new URL(tab.url).protocol);
  } catch {
    return false;
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!canInject(tab)) {
    if (tab?.id) {
      await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
      await chrome.action.setTitle({
        tabId: tab.id,
        title: "Overlay unavailable on this browser page"
      });
    }
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    await chrome.action.setBadgeText({ tabId: tab.id, text: "" });
    await chrome.action.setTitle({ tabId: tab.id, title: "Toggle Research Overlay" });
  } catch (error) {
    console.error("ResearchOverlayTool could not access this tab:", error);
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.action.setBadgeText({ tabId, text: "" }).catch(() => {});
});
