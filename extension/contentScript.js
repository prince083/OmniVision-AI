// contentScript.js - currently minimal
console.log('contentScript loaded on', window.location.href);

// For dev testing: listen for messages to show an alert
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'show_alert') {
    alert('OmniVision content script received: ' + (msg.text || ''));
    sendResponse({ ok: true });
  }
});
