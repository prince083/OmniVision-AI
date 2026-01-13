import React, { useEffect, useState } from "react";

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

  const [capturedImage, setCapturedImage] = useState(null);
  const [viewingCapture, setViewingCapture] = useState(false);

  useEffect(() => {
    // Clear badge when user opens popup
    chrome.action.setBadgeText({ text: "" });

    // Check if we have a stored image
    chrome.storage.local.get(["latestCrop"], (result) => {
      if (result.latestCrop) {
        setCapturedImage(result.latestCrop);
        // Do NOT auto-switch to view, just let the user know it's there
      }
    });

    // Also listen for runtime messages (if popup is already open)
    const handler = (msg) => {
      if (msg.type === "CROPPED_IMAGE") {
        setCapturedImage(msg.image);
        chrome.storage.local.set({ latestCrop: msg.image });
        // Optionally auto-view if it just happened LIVE while popup was open?
        // Let's stick to the requested "View Option" for consistency
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const clearCapture = () => {
    setCapturedImage(null);
    setViewingCapture(false);
    chrome.storage.local.remove("latestCrop");
  };

  // ... inside App component ...
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const extractText = async () => {
    if (!capturedImage) return;

    setIsExtracting(true);
    setExtractedText("");

    try {
      // Convert base64 to blob if needed, or just send base64 string
      // Our backend expects JSON { "image": "data:image/png;base64,..." }

      const response = await fetch("http://127.0.0.1:8000/api/ocr/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ image: capturedImage })
      });

      const data = await response.json();

      if (data.error) {
        alert("OCR Error: " + data.error);
      } else {
        setExtractedText(data.text);
      }

    } catch (err) {
      console.error("OCR Failed", err);
      alert("Failed to connect to backend. Is Django running?");
    } finally {
      setIsExtracting(false);
    }
  };

  // 1. View State: Showing the image
  if (viewingCapture && capturedImage) {
    return (
      <div style={{ width: 360, padding: 16, fontFamily: "Inter" }}>
        <h2>Captured Region</h2>
        <img src={capturedImage} style={{ maxWidth: "100%", maxHeight: "200px", border: "1px solid #ccc", margin: "10px 0" }} />

        {/* OCR Result Area */}
        {extractedText && (
          <div style={{ background: "#f5f5f5", padding: "10px", borderRadius: "8px", margin: "10px 0", maxHeight: "150px", overflowY: "auto", fontSize: "13px", whiteSpace: "pre-wrap" }}>
            <strong>Extracted Text:</strong><br />
            {extractedText}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>

          {!extractedText && (
            <button onClick={extractText} disabled={isExtracting} style={{ ...btn, background: isExtracting ? "#ccc" : "#222", color: "#fff" }}>
              {isExtracting ? "Extracting..." : "⚡ Extract Text"}
            </button>
          )}

          <button onClick={() => setViewingCapture(false)} style={{ ...btn, background: "#ccc" }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const startScreenCapture = async () => {
    // get active tab first so background knows where to send screenshot
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        alert("No active tab found.");
        return;
      }
      const tabId = tabs[0].id;
      chrome.runtime.sendMessage({ type: "START_SCREEN_CAPTURE", tabId });
      window.close(); // Close popup to let user drag
    });
    // chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    //   setTimeout(() => {
    //     chrome.tabs.sendMessage(
    //       tabs[0].id,
    //       { type: "START_CROPPER" },
    //       (resp) => {
    //         if (chrome.runtime.lastError) {
    //           alert("Error: " + chrome.runtime.lastError.message);
    //         } else {
    //           console.log("Cropped Image:", resp);
    //           if (resp?.image) {
    //             const w = window.open();
    //             w.document.body.innerHTML = `<img src="${resp.image}" />`;
    //           }
    //         }
    //       }
    //     );
    //   }, 1000);

    // });
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

      {/* Dynamic Button: Capture vs View */}
      {capturedImage ? (
        <button onClick={() => setViewingCapture(true)} style={{ ...btn, background: "#e6fffa", border: "1px solid #00ff99", color: "#007744" }}>
          ✅ View Captured Image
        </button>
      ) : (
        <button onClick={startScreenCapture} style={btn}>📸 Capture Screen Area</button>
      )}

      {/* Clear Option (only if image exists) */}
      {capturedImage && (
        <button onClick={clearCapture} style={{ ...btn, fontSize: "12px", background: "transparent", border: "1px dashed #ccc", color: "#888" }}>
          🗑 Clear Capture
        </button>
      )}

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
