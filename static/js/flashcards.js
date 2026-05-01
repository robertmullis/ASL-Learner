const cards = [
    { letter: "A", image: "a_asl_example.jpg" },
    { letter: "B", image: "b_asl_example.jpg" },
    { letter: "C", image: "c_asl_example.jpg" },
    { letter: "D", image: "d_asl_example.jpg" },
    { letter: "E", image: "e_asl_example.jpg" },
    { letter: "F", image: "f_asl_example.jpg" },
    { letter: "G", image: "g_asl_example.jpg" },
    { letter: "H", image: "h_asl_example.jpg" },
    { letter: "I", image: "i_asl_example.jpg" },
    { letter: "J", image: "j_asl_example.jpg" },
    { letter: "K", image: "k_asl_example.jpg" },
    { letter: "L", image: "l_asl_example.jpg" },
    { letter: "M", image: "m_asl_example.jpg" },
    { letter: "N", image: "n_asl_example.jpg" },
    { letter: "O", image: "o_asl_example.jpg" },
    { letter: "P", image: "p_asl_example.jpg" },
    { letter: "Q", image: "q_asl_example.jpg" },
    { letter: "R", image: "r_asl_example.jpg" },
    { letter: "S", image: "s_asl_example.jpg" },
    { letter: "T", image: "t_asl_example.jpg" },
    { letter: "U", image: "u_asl_example.jpg" },
    { letter: "V", image: "v_asl_example.jpg" },
    { letter: "W", image: "w_asl_example.jpg" },
    { letter: "X", image: "x_asl_example.jpg" },
    { letter: "Y", image: "y_asl_example.jpg" },
    { letter: "Z", image: "z_asl_example.jpg" },
];

let currentIndex = 0;
let isFlipped = false;
const seen = new Set();

setInterval(async () => {
    const res = await fetch('/check_session');
    if (res.status === 401) {
        window.location.href = '/login';
    }
}, 60000);

function buildDots() {
    const wrap = document.getElementById('dots-wrap');
    wrap.innerHTML = '';
    cards.forEach((c, i) => {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.textContent = c.letter;
        dot.onclick = () => goTo(i);
        dot.id = `dot-${i}`;
        wrap.appendChild(dot);
    });
}

function goTo(index) {
    if (isFlipped) {
        isFlipped = false;
        document.getElementById('card').classList.remove('flipped');
        setTimeout(() => {
            currentIndex = index;
            updateCard();
        }, 500);
    } else {
        currentIndex = index;
        updateCard();
    }
}

function updateCard() {
    const card = cards[currentIndex];
    document.getElementById('front-letter').textContent = card.letter;
    document.getElementById('back-letter').textContent = card.letter;

    // Update image on back
    const backImg = document.getElementById('back-image');
    if (card.image) {
        backImg.src = "/static/examples/" + card.image;
        backImg.style.display = 'block';
    } else {
        backImg.style.display = 'none';
    }

    const total = cards.length;
    const num = currentIndex + 1;
    document.getElementById('progress-count').textContent = `${num} / ${total}`;
    document.getElementById('progress-fill').style.width = `${(num / total) * 100}%`;

    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').disabled = currentIndex === total - 1;

    document.querySelectorAll('.dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentIndex);
        if (seen.has(i)) d.classList.add('seen');
    });
}

function flipCard() {
    isFlipped = !isFlipped;
    document.getElementById('card').classList.toggle('flipped', isFlipped);
    if (isFlipped) seen.add(currentIndex);
}

function navigate(dir) {
    const next = currentIndex + dir;
    if (next < 0 || next >= cards.length) return;
    goTo(next);
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') navigate(1);
    else if (e.key === 'ArrowLeft') navigate(-1);
    else if (e.key === ' ') { e.preventDefault(); flipCard(); }
});

buildDots();
updateCard();