// background.js - simple service worker placeholder
self.addEventListener('install', () => {
  console.log('Background service worker installed');
});

self.addEventListener('activate', () => {
  console.log('Background service worker activated');
});

// Listen for messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg === 'ping') {
    sendResponse({ reply: 'pong from background' });
  }
});