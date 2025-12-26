// --- STATE & CONFIG ---
let timeLeft = 25 * 60;
let timerId = null;
let isRunning = false;
let isFocusMode = true;

// Sound URLs
const sounds = {
    click: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3'),
    gong: new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_0625c153e2.mp3'),
    rain: new Audio('https://cdn.pixabay.com/audio/2022/05/17/audio_3497d3534b.mp3'),
    cafe: new Audio('https://cdn.pixabay.com/audio/2017/08/08/00/39/coffee-shop-2610565_1280.mp3'),
    white: new Audio('https://cdn.pixabay.com/audio/2021/11/24/audio_8295b28a64.mp3')
};

// Loop Hintergrundgeräusche
sounds.rain.loop = true;
sounds.cafe.loop = true;
sounds.white.loop = true;
let currentAmbience = null;

// --- DOM ELEMENTS ---
const elements = {
    timer: document.getElementById('timer'),
    startBtn: document.getElementById('startBtn'),
    status: document.getElementById('status-text'),
    themeToggle: document.getElementById('theme-toggle'),
    focusSelect: document.getElementById('focusTimeSelect'),
    breakSelect: document.getElementById('breakTimeSelect'),
    soundSelect: document.getElementById('soundSelect'),
    sessionCount: document.getElementById('session-count'),
    notepad: document.getElementById('notepad'),
    mainTask: document.getElementById('main-task-input'),
    shortcutBtn: document.getElementById('pomodoroShortcut'),
    resetBtn: document.getElementById('resetBtn')
};

// --- INITIALIZATION ---
function init() {
    // Theme laden
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.checked = true;
    }

    // Statistik laden
    loadStats();

    // Notizen laden
    elements.notepad.value = localStorage.getItem('notepadContent') || '';
    elements.mainTask.value = localStorage.getItem('mainTaskContent') || '';
}

// --- TIMER LOGIC ---
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    elements.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.title = `(${minutes}:${seconds.toString().padStart(2, '0')}) GlassFocus`;
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    isRunning = true;
    sounds.click.play();
    elements.startBtn.textContent = 'Pause';
    elements.status.textContent = isFocusMode ? 'FOKUS MODE' : 'PAUSENZEIT';
    elements.status.style.opacity = '1';
    
    playAmbience();

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft === 0) {
            completeSession();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    elements.startBtn.textContent = 'Weiter';
    elements.status.textContent = 'PAUSIERT';
    elements.status.style.opacity = '0.5';
    stopAmbience();
}

function resetTimer() {
    pauseTimer();
    isFocusMode = true;
    timeLeft = parseInt(elements.focusSelect.value) * 60;
    updateDisplay();
    elements.startBtn.textContent = 'Start';
    elements.status.textContent = 'BEREIT';
    elements.status.style.opacity = '1';
}

function completeSession() {
    pauseTimer();
    sounds.gong.play();
    
    if (isFocusMode) {
        incrementStats();
        isFocusMode = false;
        timeLeft = parseInt(elements.breakSelect.value) * 60;
        elements.status.textContent = 'ZEIT FÜR PAUSE';
        elements.startBtn.textContent = 'Pause starten';
        flashScreen('#30d158');
    } else {
        isFocusMode = true;
        timeLeft = parseInt(elements.focusSelect.value) * 60;
        elements.status.textContent = 'FOKUS BEENDET';
        elements.startBtn.textContent = 'Fokus starten';
        flashScreen('#0a84ff');
    }
    updateDisplay();
}

function quickStartPomodoro() {
    elements.focusSelect.value = "25";
    elements.breakSelect.value = "5";
    resetTimer();
    startTimer();
}

// --- AMBIENCE SOUNDS ---
function playAmbience() {
    const selectedSound = elements.soundSelect.value;
    if (selectedSound !== 'none' && sounds[selectedSound]) {
        currentAmbience = sounds[selectedSound];
        currentAmbience.play().catch(e => console.log('Audio Autoplay Blocked'));
    }
}

function stopAmbience() {
    if (currentAmbience) {
        currentAmbience.pause();
        currentAmbience.currentTime = 0;
    }
}

// --- STATS LOGIC ---
function loadStats() {
    const today = new Date().toLocaleDateString();
    const stats = JSON.parse(localStorage.getItem('glassFocusStats')) || { date: today, count: 0 };

    // Reset wenn neuer Tag
    if (stats.date !== today) {
        stats.date = today;
        stats.count = 0;
    }
    
    elements.sessionCount.textContent = stats.count;
    localStorage.setItem('glassFocusStats', JSON.stringify(stats));
}

function incrementStats() {
    const stats = JSON.parse(localStorage.getItem('glassFocusStats'));
    stats.count++;
    localStorage.setItem('glassFocusStats', JSON.stringify(stats));
    elements.sessionCount.textContent = stats.count;
}

// --- EVENT LISTENERS ---
elements.startBtn.addEventListener('click', toggleTimer);
elements.resetBtn.addEventListener('click', resetTimer);
elements.shortcutBtn.addEventListener('click', quickStartPomodoro);

elements.focusSelect.addEventListener('change', function() {
    if (!isRunning && isFocusMode) {
        timeLeft = parseInt(this.value) * 60;
        updateDisplay();
    }
});

elements.breakSelect.addEventListener('change', function() {
    if (!isRunning && !isFocusMode) {
        timeLeft = parseInt(this.value) * 60;
        updateDisplay();
    }
});

elements.soundSelect.addEventListener('change', function() {
    if (isRunning) {
        stopAmbience();
        playAmbience();
    }
});

elements.themeToggle.addEventListener('change', function(e) {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
});

// Auto-Save für Notizen
elements.notepad.addEventListener('input', (e) => localStorage.setItem('notepadContent', e.target.value));
elements.mainTask.addEventListener('input', (e) => localStorage.setItem('mainTaskContent', e.target.value));

// UI Helper
function flashScreen(color) {
    const originalBg = getComputedStyle(document.body).backgroundColor;
    document.body.style.backgroundColor = color;
    setTimeout(() => { document.body.style.backgroundColor = ""; }, 300);
}

// Start
init();