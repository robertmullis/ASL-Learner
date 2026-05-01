const errorMsg = document.querySelector('.error');
if (errorMsg) {
    setTimeout(function () {
        errorMsg.style.display = 'none';
    },
        5000);
}

function checkStrength(val) {
    const score = [
        val.length >= 8,
        /[A-Z]/.test(val),
        /[0-9]/.test(val),
        /[!@#$%^&*]/.test(val)
    ].filter(Boolean).length;

    const colors = ['#E24B4A', '#EF9F27', '#639922', '#1D9E75'];
    for (let i = 1; i <= 4; i++) {
        document.getElementById('b' + i).style.backgroundColor =
            i <= score ? colors[score - 1] : '#ccc';
    }

    const btn = document.querySelector('button[type="submit"]');
    btn.disabled = score < 2 || val.length < 8;
    btn.style.opacity = score < 2 || val.length < 8 ? '0.5' : '1';
    btn.style.cursor = score < 2 || val.length < 8 ? 'not-allowed' : 'pointer';
}