const video    = document.getElementById('webcam');
const canvas   = document.getElementById('capture');
const letterEl = document.getElementById('letter');
const statusEl = document.getElementById('status');
let running = false;

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            canvas.width  = video.videoWidth;
            canvas.height = video.videoHeight;
            statusEl.textContent = 'Camera ready';
            running = true;
            loop();
        };
    } catch (e) {
        statusEl.textContent = 'Camera access denied.';
    }
}

async function loop() {
    if (!running) return;

    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.7);

    try {
        const res = await fetch('/predict_live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });
        const json = await res.json();

        if (json.predicted) {
            letterEl.textContent = json.predicted;
            letterEl.className = 'predicted-letter';
            statusEl.textContent = 'Hand detected';
        } else {
            letterEl.textContent = '–';
            letterEl.className = 'predicted-letter no-hand';
            statusEl.textContent = json.error || 'No hand detected';
        }
    } catch (_) {
        statusEl.textContent = 'Prediction error';
    }

    setTimeout(loop, 200);
}

startCamera();