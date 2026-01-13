console.log("Background service worker running...");

// Listener for messages from popup or content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "PING") {
    sendResponse({ reply: "PONG from background.js", time: Date.now() });
  }

  if (msg.type === "SHOW_ALERT") {
    console.log("Background forwarding SHOW_ALERT");
    sendResponse({ ack: true });
  }
  // - CAPTURE_SCREEN
  if (msg.type === "START_SCREEN_CAPTURE") {
    // expect msg.tabId to indicate which tab should receive the screenshot
    const tabId = msg.tabId;
    captureScreen(tabId);
  }
  // more message types will be added later:
  // - SEND_AUDIO_CHUNK
  // - OCR_IMAGE
  // - YOUTUBE_TRANSCRIBE
  // etc.

  chrome.storage.local.set({ latestCrop: msg.image }, () => {
    // Notify user to open popup
    chrome.action.setBadgeText({ text: "VIEW" });
    chrome.action.setBadgeBackgroundColor({ color: "#00FF00" });
  });

  return true; // keeps message channel alive
});


// Manage offscreen document
async function setupOffscreenDocument(path) {
  // Check if offscreen document exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Create offscreen document
  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['USER_MEDIA'],
    justification: 'Recording screen for user-requested crop'
  });
}

async function captureScreen(targetTabId) {
  try {
    await chrome.action.setBadgeText({ text: "..." });
    console.log("Capturing visible tab via captureVisibleTab...");

    // Use the native extension API - much faster and no permission prompt for active tab
    // We can capture JPEG for speed or PNG for quality. PNG is better for OCR.
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });

    console.log("Screenshot success.");

    // Send successful screenshot to content script
    if (typeof targetTabId === "number") {
      console.log("Sending SCREENSHOT_READY to tab:", targetTabId);
      chrome.tabs.sendMessage(targetTabId, {
        type: "SCREENSHOT_READY",
        screenshot: dataUrl
      }, (resp) => {
        console.log("Tab response:", resp, "LastError:", chrome.runtime.lastError);
      });
      await chrome.action.setBadgeText({ text: "OK" });
      setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2000);
    }

  } catch (e) {
    console.error("Screen capture failed:", e);
    await chrome.action.setBadgeText({ text: "ERR" });
    if (typeof targetTabId === "number") {
      chrome.tabs.sendMessage(targetTabId, {
        type: "SCREENSHOT_FAILED",
        reason: e.message
      });
    }
  }
}
