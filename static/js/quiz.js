const TOTAL_QUESTIONS = 10;
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

let questionIndex = 0;
let correct = 0;
let wrong = 0;
let currentLetter = '';
let stream = null;
let waitingForNext = false;

setInterval(async () => {
    const res = await fetch('/check_session');
    if (res.status === 401) {
        window.location.href = '/login';
    }
}, 60000);

function getQuestions() {
    const shuffled = [...alphabet].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_QUESTIONS);
}

let questions = getQuestions();

function updateScoreUI() {
    document.getElementById('score-correct').textContent = correct;
    document.getElementById('score-wrong').textContent = wrong;
    document.getElementById('score-total').textContent = questionIndex;
}

function loadQuestion() {
    currentLetter = questions[questionIndex];
    document.getElementById('prompt-letter').textContent = currentLetter;
    document.getElementById('question-count').textContent = `Question ${questionIndex + 1} of ${TOTAL_QUESTIONS}`;

    const badge = document.getElementById('result-badge');
    badge.style.display = 'none';
    badge.className = 'result-badge';

    if (stream) {
        document.getElementById('camera-actions').innerHTML = `
            <button class="btn btn-capture" id="btn-capture" onclick="startCountdown()">
                <span class="material-symbols-outlined">camera</span>
                Capture Sign
            </button>
            <button class="btn btn-skip" onclick="skipQuestion()">
                <span class="material-symbols-outlined">skip_next</span>
                Skip
            </button>
            <span class="camera-status" id="camera-status">Camera ready</span>
        `;
    }

    waitingForNext = false;
}

async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        const video = document.getElementById('video');
        video.srcObject = stream;
        document.getElementById('camera-placeholder').style.display = 'none';
        video.style.display = 'block';

        document.getElementById('camera-actions').innerHTML = `
            <button class="btn btn-capture" id="btn-capture" onclick="startCountdown()">
                <span class="material-symbols-outlined">camera</span>
                Capture Sign
            </button>
            <button class="btn btn-skip" onclick="skipQuestion()">
                <span class="material-symbols-outlined">skip_next</span>
                Skip
            </button>
            <span class="camera-status" id="camera-status">Camera ready</span>
        `;
    } catch (err) {
        document.getElementById('camera-status').textContent = 'Camera access denied.';
        console.error('Camera error:', err);
    }
}

function startCountdown() {
    if (waitingForNext) return;
    const btn = document.getElementById('btn-capture');
    if (btn) btn.disabled = true;

    const overlay = document.getElementById('countdown-overlay');
    overlay.style.display = 'flex';
    let count = 3;
    overlay.textContent = count;

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            overlay.textContent = count;
        } else {
            clearInterval(timer);
            overlay.style.display = 'none';
            captureAndPredict();
        }
    }, 1000);
}

async function captureAndPredict() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('capture-canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0);

    const flash = document.getElementById('flash-overlay');
    flash.style.opacity = '0.8';
    setTimeout(() => { flash.style.opacity = '0'; }, 150);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);

    setStatus('Analyzing...');

    try {
        const res = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData, expected: currentLetter })
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();

        if (data.error === 'No hand detected') {
            setStatus('No hand detected — try again!');
            const btn = document.getElementById('btn-capture');
            if (btn) btn.disabled = false;
            return;
        }

        showResult(data.correct, data.predicted || '?');

    } catch (err) {
        console.error('Predict error:', err);
        setStatus('Error contacting server.');
        const btn = document.getElementById('btn-capture');
        if (btn) btn.disabled = false;
    }
}

function showResult(isCorrect, predicted) {
    waitingForNext = true;

    if (isCorrect) {
        correct++;
    } else {
        wrong++;
    }
    questionIndex++;
    updateScoreUI();

    const badge = document.getElementById('result-badge');
    const icon = document.getElementById('result-icon');
    const text = document.getElementById('result-text');

    badge.style.display = 'flex';

    if (isCorrect) {
        badge.classList.add('result-correct');
        icon.textContent = 'check_circle';
        text.textContent = 'Correct!';
    } else {
        badge.classList.add('result-wrong');
        icon.textContent = 'cancel';
        text.textContent = `Got "${predicted}" — expected "${currentLetter}"`;
    }

    if (questionIndex >= TOTAL_QUESTIONS) {
        setTimeout(showResults, 1800);
        return;
    }

    document.getElementById('camera-actions').innerHTML = `
        <button class="btn btn-next" style="display:flex;" onclick="nextQuestion()">
            <span class="material-symbols-outlined">arrow_forward</span>
            Next question
        </button>
        <span class="camera-status" id="camera-status">${isCorrect ? '✓ Nice work!' : '✗ Keep practicing'}</span>
    `;
}

function nextQuestion() {
    loadQuestion();
}

function skipQuestion() {
    wrong++;
    questionIndex++;
    updateScoreUI();
    if (questionIndex >= TOTAL_QUESTIONS) {
        showResults();
        return;
    }
    loadQuestion();
}

function setStatus(msg) {
    const el = document.getElementById('camera-status');
    if (el) el.textContent = msg;
}

function showResults() {
    document.getElementById('quiz-ui').style.display = 'none';
    const rs = document.getElementById('results-screen');
    rs.style.display = 'flex';

    const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
    document.getElementById('results-score').textContent = pct + '%';
    document.getElementById('final-correct').textContent = correct;
    document.getElementById('final-wrong').textContent = wrong;

    let emoji = '😊', subtitle = 'Good effort!';
    if (pct === 100) { emoji = '🏆'; subtitle = 'Perfect score!'; }
    else if (pct >= 80) { emoji = '🎉'; subtitle = 'Great job!'; }
    else if (pct >= 60) { emoji = '👍'; subtitle = 'Nice work!'; }
    else if (pct >= 40) { emoji = '📚'; subtitle = 'Keep practicing!'; }
    else { emoji = '💪'; subtitle = 'Review the flashcards and try again!'; }

    document.getElementById('results-emoji').textContent = emoji;
    document.getElementById('results-subtitle').textContent = subtitle;

    if (stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
    }
}

function restartQuiz() {
    questions = getQuestions();
    questionIndex = 0;
    correct = 0;
    wrong = 0;
    waitingForNext = false;
    stream = null;

    document.getElementById('results-screen').style.display = 'none';
    document.getElementById('quiz-ui').style.display = 'flex';

    const video = document.getElementById('video');
    video.style.display = 'none';
    video.srcObject = null;
    document.getElementById('camera-placeholder').style.display = 'flex';

    document.getElementById('camera-actions').innerHTML = `
        <button class="btn btn-start" id="btn-start" onclick="startCamera()">
            <span class="material-symbols-outlined">videocam</span>
            Start Camera
        </button>
        <span class="camera-status" id="camera-status">Camera off</span>
    `;

    updateScoreUI();
    loadQuestion();
}

// Init
loadQuestion();