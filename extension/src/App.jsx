import React from "react";

export default function App() {

  const sendPing = () => {
    chrome.runtime.sendMessage({ type: "PING" }, (resp) => {
      console.log("Background response:", resp);
      alert(JSON.stringify(resp));
    });
  };

  const notifyContent = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

      if (!tabs || !tabs[0]) return;

      setTimeout(() => {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "SHOW_ALERT", text: "Hello from Popup!" },
          (resp) => {
            console.log("Content script responded:", resp);
          }
        );
      }, 1000);

    });
  };

  return (
    <div style={{ width: 360, padding: 16, fontFamily: "Inter" }}>
      <h2>OmniVision AI</h2>
      <p>Day 2 — Popup UI + Message Pipeline</p>

      <button onClick={sendPing} style={btn}>
        Ping Background
      </button>

      <button onClick={notifyContent} style={btn}>
        Send Alert to Content Script
      </button>

      <hr style={{ margin: "16px 0" }} />

      <button style={btn}>📸 Capture Screen Area</button>

      <button style={btn}>🖼 Extract Text from Image</button>

      <button style={btn}>🎧 Transcribe YouTube</button>

    </div>
  );
}

const btn = {
  padding: "10px 12px",
  margin: "6px 0",
  width: "100%",
  fontSize: "14px",
  cursor: "pointer",
};
