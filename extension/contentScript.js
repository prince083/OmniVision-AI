console.log("contentScript.js injected on:", window.location.href);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "SHOW_ALERT") {
    alert("Popup says: " + msg.text);
    sendResponse({ ok: true });
  }

  return true;
});
