// import "./src/cropperOverlay.css";

// Inject CSS manually if import fails
function injectCSS() {
  const style = document.createElement("style");
  style.textContent = `
    #ov-cropper-mask {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.25);
      cursor: crosshair;
      z-index: 999999999;
    }
    #ov-cropper-selection {
      position: fixed;
      border: 2px solid #00ff99;
      background: rgba(0,255,153,0.2);
      z-index: 1000000000;
    }
  `;
  // FIX: Use fallback if head is missing
  (document.head || document.documentElement).appendChild(style);
}
injectCSS();


console.log("OmniVision content script active");

// global storage for screenshot from background
let fullScreenshot = null;

// listen for screenshot from background
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "SCREENSHOT_READY") {
    console.log("Content script received SCREENSHOT_READY. Size:", msg.screenshot.length);
    // alert("DEBUG: Screenshot received in Content Script!"); 
    fullScreenshot = msg.screenshot;
    console.log("Starting overlay...");
    startCropOverlay();
    sendResponse("OK");
  }

  if (msg.type === "SCREENSHOT_FAILED") {
    console.warn("Screenshot failed:", msg.reason);
    alert("Capture failed: " + msg.reason);
    fullScreenshot = null;
    return false;
  }

  return false;
});


// overlay + cropping
function startCropOverlay() {

  if (!fullScreenshot) return;

  let startX, startY, endX, endY;
  let isDrawing = false;

  const overlay = document.createElement("div");
  overlay.style = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.25);
    cursor: crosshair;
    z-index: 9999999;
  `;
  document.body.appendChild(overlay);

  const box = document.createElement("div");
  box.style = `
    position: fixed;
    border: 2px solid #00ff99;
    background: rgba(0,255,153,0.2);
    z-index: 10000000;
    display: none;
    pointer-events: none;
  `;
  document.body.appendChild(box);


  // pointer events solve ALL YouTube issues
  overlay.addEventListener("pointerdown", e => {
    isDrawing = true;

    startX = e.clientX;
    startY = e.clientY;

    box.style.left = startX + "px";
    box.style.top = startY + "px";
    box.style.width = "0px";
    box.style.height = "0px";
    box.style.display = "block";

  });

  overlay.addEventListener("pointermove", e => {
    if (!isDrawing) return;

    endX = e.clientX;
    endY = e.clientY;

    box.style.left = Math.min(startX, endX) + "px";
    box.style.top = Math.min(startY, endY) + "px";
    box.style.width = Math.abs(endX - startX) + "px";
    box.style.height = Math.abs(endY - startY) + "px";
  });


  overlay.addEventListener("pointerup", e => {
    isDrawing = false;

    overlay.remove();
    box.remove();

    cropScreenshot(startX, startY, endX, endY);
  });
}



// perform actual crop
function cropScreenshot(sx, sy, ex, ey) {

  const img = new Image();
  img.src = fullScreenshot;

  img.onload = () => {

    // Calculate scaling factor (Screenshot width / Window width)
    // This is crucial for High DPI screens (Retina, 4K) where 1 CSS pixel != 1 Device pixel
    const scaleX = img.naturalWidth / window.innerWidth;
    const scaleY = img.naturalHeight / window.innerHeight;

    const cropX = Math.min(sx, ex) * scaleX;
    const cropY = Math.min(sy, ey) * scaleY;
    const cropW = Math.abs(ex - sx) * scaleX;
    const cropH = Math.abs(ey - sy) * scaleY;

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(
      img,
      cropX, cropY, cropW, cropH,
      0, 0, cropW, cropH
    );

    const cropped = canvas.toDataURL("image/png");

    // send cropped image to popup
    chrome.runtime.sendMessage({
      type: "CROPPED_IMAGE",
      image: cropped
    });
  };
}
