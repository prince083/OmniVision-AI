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

  // Prevent multiple overlays from being created
  const existingOverlay = document.getElementById('ov-crop-overlay');
  if (existingOverlay) {
    console.log("Overlay already exists, removing old one");
    existingOverlay.remove();
  }

  let startX, startY, endX, endY;
  let isDrawing = false;
  let pointerDownFired = false; // Guard against double-firing

  const overlay = document.createElement("div");
  overlay.id = 'ov-crop-overlay'; // Add ID for tracking
  overlay.style = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.25);
    cursor: crosshair;
    z-index: 9999999;
    touch-action: none;
  `;
  document.body.appendChild(overlay);

  const box = document.createElement("div");
  box.style = `
    position: fixed;
    border: 2px solid #00ff00;
    background: rgba(0,255,0,0.15);
    z-index: 10000000;
    display: none;
    pointer-events: none;
    box-shadow: 0 0 10px rgba(0,255,0,0.3);
  `;
  document.body.appendChild(box);

  // Add dimension label
  const label = document.createElement("div");
  label.style = `
    position: fixed;
    background: #00ff00;
    color: #000;
    padding: 4px 8px;
    font-size: 14px;
    font-weight: bold;
    border-radius: 4px;
    z-index: 10000001;
    display: none;
    pointer-events: none;
    font-family: monospace;
  `;
  document.body.appendChild(label);


  // pointer events solve ALL YouTube issues
  overlay.addEventListener("pointerdown", e => {
    // Prevent double-firing
    if (pointerDownFired) {
      console.log("Ignoring duplicate pointerdown");
      return;
    }
    pointerDownFired = true;

    isDrawing = true;

    // Capture pointer to ensure we get all events even outside overlay
    overlay.setPointerCapture(e.pointerId);

    startX = e.clientX;
    startY = e.clientY;

    console.log(`Pointer DOWN at (${startX}, ${startY})`);

    box.style.left = startX + "px";
    box.style.top = startY + "px";
    box.style.width = "0px";
    box.style.height = "0px";
    box.style.display = "block";

    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event bubbling
  });

  overlay.addEventListener("pointermove", e => {
    if (!isDrawing) return;

    endX = e.clientX;
    endY = e.clientY;

    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    box.style.left = Math.min(startX, endX) + "px";
    box.style.top = Math.min(startY, endY) + "px";
    box.style.width = width + "px";
    box.style.height = height + "px";

    // Update label
    label.style.display = "block";
    label.style.left = Math.min(startX, endX) + "px";
    label.style.top = (Math.min(startY, endY) - 30) + "px";
    label.textContent = `${Math.round(width)}px × ${Math.round(height)}px`;

    e.preventDefault();
  });


  overlay.addEventListener("pointerup", e => {
    isDrawing = false;

    endX = e.clientX;
    endY = e.clientY;

    console.log(`Pointer UP at (${endX}, ${endY})`);
    console.log(`Total drag: ${Math.abs(endX - startX)}px x ${Math.abs(endY - startY)}px`);

    overlay.remove();
    box.remove();
    label.remove(); // Hide label after selection

    // Only crop if drag was significant (not just a click)
    if (Math.abs(endX - startX) > 10 && Math.abs(endY - startY) > 10) {
      cropScreenshot(startX, startY, endX, endY);
    } else {
      console.log("Selection too small, ignoring");
      alert("Please drag to select an area (selection was too small)");
    }
  });
}



// perform actual crop
function cropScreenshot(sx, sy, ex, ey) {

  const img = new Image();
  img.src = fullScreenshot;

  img.onload = () => {

    // Debug: Log selection coordinates
    console.log("Selection coordinates (CSS pixels):");
    console.log(`  Start: (${sx}, ${sy})`);
    console.log(`  End: (${ex}, ${ey})`);
    console.log(`  Width: ${Math.abs(ex - sx)}, Height: ${Math.abs(ey - sy)}`);

    // Calculate scaling factor (Screenshot width / Window width)
    // This is crucial for High DPI screens (Retina, 4K) where 1 CSS pixel != 1 Device pixel
    const scaleX = img.naturalWidth / window.innerWidth;
    const scaleY = img.naturalHeight / window.innerHeight;

    console.log(`Screenshot size: ${img.naturalWidth} x ${img.naturalHeight}`);
    console.log(`Window size: ${window.innerWidth} x ${window.innerHeight}`);
    console.log(`Scale factors: ${scaleX} x ${scaleY}`);

    const cropX = Math.min(sx, ex) * scaleX;
    const cropY = Math.min(sy, ey) * scaleY;
    const cropW = Math.abs(ex - sx) * scaleX;
    const cropH = Math.abs(ey - sy) * scaleY;

    console.log("Crop region (device pixels):");
    console.log(`  X: ${cropX}, Y: ${cropY}`);
    console.log(`  Width: ${cropW}, Height: ${cropH}`);

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

    console.log(`Final cropped image size: ${canvas.width} x ${canvas.height}`);

    // send cropped image to popup
    chrome.runtime.sendMessage({
      type: "CROPPED_IMAGE",
      image: cropped
    });
  };
}
