import React, { useEffect, useState, useRef } from "react";

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
  const [captureSource, setCaptureSource] = useState("screen"); // 'screen' | 'upload'

  useEffect(() => {
    // Clear badge when user opens popup
    chrome.action.setBadgeText({ text: "" });

    // Check if we have a stored image
    chrome.storage.local.get(["latestCrop"], (result) => {
      if (result.latestCrop) {
        setCapturedImage(result.latestCrop);
      }
    });

    // Also listen for runtime messages (if popup is already open)
    const handler = (msg) => {
      if (msg.type === "CROPPED_IMAGE") {
        setCapturedImage(msg.image);
        setCaptureSource("screen");
        chrome.storage.local.set({ latestCrop: msg.image });
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
  const [copySuccess, setCopySuccess] = useState(false);

  const fileInputRef = useRef(null);

  const extractText = async (imageOverride) => {
    const imageToUse = typeof imageOverride === 'string' ? imageOverride : capturedImage;
    if (!imageToUse) return;

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
        body: JSON.stringify({ image: imageToUse })
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setCapturedImage(base64String);
        setCaptureSource("upload");
        setViewingCapture(true);
        // Manual extraction required by user
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    }
  };

  // 1. View State: Showing the image
  if (viewingCapture && capturedImage) {
    return (
      <div style={{ width: 360, padding: 16, fontFamily: "Inter" }}>
        <h2>{captureSource === "upload" ? "Uploaded Image" : "Captured Region"}</h2>
        <img src={capturedImage} style={{ maxWidth: "100%", maxHeight: "200px", border: "1px solid #ccc", margin: "10px 0" }} />

        {/* OCR Result Area */}
        {extractedText && (
          <div>
            <div style={{ background: "#f5f5f5", padding: "10px", borderRadius: "8px", margin: "10px 0", maxHeight: "150px", overflowY: "auto", fontSize: "13px", whiteSpace: "pre-wrap", border: "1px solid #e0e0e0" }}>
              <strong style={{ color: "#333" }}>Extracted Text:</strong><br />
              {extractedText}
            </div>
            <button
              onClick={copyToClipboard}
              style={{
                ...btn,
                background: copySuccess ? "#10b981" : "#3b82f6",
                color: "#fff",
                marginBottom: "10px",
                transition: "all 0.3s ease"
              }}
            >
              {copySuccess ? "✓ Copied!" : "📋 Copy to Clipboard"}
            </button>
          </div>
        )}

        {/* Progress Bar during OCR */}
        {isExtracting && (
          <div style={{ margin: "15px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>✨ Extracting text...</span>
            </div>
            <div style={{
              width: "100%",
              height: "8px",
              background: "#e0e0e0",
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)",
                backgroundSize: "200% 100%",
                animation: "progress-animation 1.5s ease-in-out infinite",
                borderRadius: "4px"
              }}></div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>

          {!extractedText && !isExtracting && (
            <button onClick={extractText} style={{ ...btn, background: "#222", color: "#fff" }}>
              ⚡ Extract Text
            </button>
          )}

          <button onClick={() => {
            setViewingCapture(false);
            if (captureSource === "upload") {
              setCapturedImage(null);
              setExtractedText("");
            }
          }} style={{ ...btn, background: "#6b7280", color: "#fff" }}>
            ← Back
          </button>
        </div>

        {/* CSS Animation for progress bar */}
        <style>{`
          @keyframes progress-animation {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
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

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileUpload}
      />
      <button onClick={() => fileInputRef.current.click()} style={btn}>🖼 Extract Text from Image</button>

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
