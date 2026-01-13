chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.type === "CAPTURE_SCREEN") {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always"
                },
                audio: false
            });

            const track = stream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const bitmap = await imageCapture.grabFrame();

            // Stop the stream immediately
            track.stop();

            // Draw to canvas to get base64
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(bitmap, 0, 0);

            const base64 = canvas.toDataURL("image/png");

            sendResponse({ success: true, screenshot: base64 });
        } catch (err) {
            console.error("Offscreen capture error:", err);
            sendResponse({ success: false, error: err.message });
        }
        return true; // async
    }
});
