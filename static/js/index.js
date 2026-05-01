function openModal() {
    document.getElementById("imgModal").style.display = "flex";
}

function closeOutside(event) {
    // If the click happened on the viewport (the dark area), close the modal
    if (event.target.id === "zoom-viewport" || event.target.id === "imgModal") {
        closeModal();
    }
}

// Update closeModal to reset zoom when exiting
function closeModal() {
    document.getElementById("imgModal").style.display = "none";
    resetZoom(); // Clear zoom state for next time
};

let scale = 1;
let isDragging = false;
let startX, startY, translateX = 0, translateY = 0;

const img = document.getElementById("fullImg");
img.ondragstart = function () { return false; };
const viewport = document.getElementById("zoom-viewport");

setInterval(async () => {
    const res = await fetch('/check_session');
    if (res.status === 401) {
        window.location.href = '/login';
    }
}, 60000);

// Zoom Logic
function changeZoom(amount) {
    scale = Math.min(Math.max(1, scale + amount), 4); // Limit zoom between 1x and 4x
    updateTransform();
}

function resetZoom() {
    scale = 1; translateX = 0; translateY = 0;
    updateTransform();
}

// Panning Logic
viewport.onmousedown = (e) => {
    e.preventDefault(); // Prevents default browser actions
    if (scale <= 1) return; // Only pan if zoomed in

    isDragging = true;
    img.style.cursor = 'grabbing';

    // Calculate the offset so the image doesn't "jump" when clicked
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
};

window.onmousemove = (e) => {
    if (!isDragging) return;

    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    updateTransform();
};

window.onmouseup = () => {
    isDragging = false;
    img.style.cursor = 'grab';
};

function updateTransform() {
    img.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;

    img.style.cursor = scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default';
}

// Mouse Wheel Zoom
viewport.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    changeZoom(delta);
};