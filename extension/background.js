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

  // more message types will be added later:
  // - CAPTURE_SCREEN
  // - SEND_AUDIO_CHUNK
  // - OCR_IMAGE
  // - YOUTUBE_TRANSCRIBE
  // etc.

  return true; // keeps message channel alive
});
