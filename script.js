// 1. CLOCK & DATE
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('clock').innerText = `${hours}:${minutes}`;

    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    document.getElementById('current-date').innerText = now.toLocaleDateString('en-US', options);

    const hour = now.getHours();
    let greeting = "Good Morning.";
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon.";
    if (hour >= 17) greeting = "Good Evening.";
    document.getElementById('greeting').innerText = greeting;
}
setInterval(updateClock, 1000);
updateClock();

// 2. TO-DO LIST
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
let tasks = JSON.parse(localStorage.getItem('studentTasks')) || [];

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <span onclick="toggleTask(${index})">${task.text}</span>
            <button class="delete-btn" onclick="deleteTask(${index})">
                <ion-icon name="trash-outline"></ion-icon>
            </button>
        `;
        taskList.appendChild(li);
    });
    taskCount.innerText = `${tasks.length} tasks`;
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
}

function addTask() {
    const text = taskInput.value.trim();
    if (text !== "") {
        tasks.push({ text: text, completed: false });
        taskInput.value = "";
        renderTasks();
    }
}

window.toggleTask = (index) => {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
};

window.deleteTask = (index) => {
    tasks.splice(index, 1);
    renderTasks();
};

addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});
renderTasks();

// 3. POMODORO TIMER
let timerInterval;
let timeLeft = 25 * 60;
let isRunning = false;
const timeDisplay = document.getElementById('pomodoro-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const modeBtns = document.querySelectorAll('.mode-btn');

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
    timeDisplay.innerText = formatTime(timeLeft);
}

function startTimer() {
    if (isRunning) {
        clearInterval(timerInterval);
        startBtn.innerText = "Start";
        startBtn.style.background = "var(--accent-color)";
        isRunning = false;
    } else {
        timerInterval = setInterval(() => {
            timeLeft--;
            updateDisplay();
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert("Time's up!");
                isRunning = false;
                startBtn.innerText = "Start";
            }
        }, 1000);
        startBtn.innerText = "Pause";
        startBtn.style.background = "var(--danger-color)";
        isRunning = true;
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.innerText = "Start";
    startBtn.style.background = "var(--accent-color)";
    const activeMode = document.querySelector('.mode-btn.active');
    timeLeft = parseInt(activeMode.getAttribute('data-time')) * 60;
    updateDisplay();
}

startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        timeLeft = parseInt(btn.getAttribute('data-time')) * 60;
        if (isRunning) startTimer();
        updateDisplay();
    });
});

// 4. FOCUS SOUNDS (Web Audio API)
const soundBtns = document.querySelectorAll('.sound-btn');
const stopSoundBtn = document.getElementById('stop-sound');
const volumeSlider = document.getElementById('volume-slider');
let audioCtx;
let noiseSource;
let gainNode;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        gainNode.connect(audioCtx.destination);
    }
}

function createNoiseBuffer(type) {
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds buffer
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'white') {
            data[i] = white;
        } else if (type === 'brown') {
            const lastOut = (i > 0) ? data[i - 1] : 0;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            data[i] *= 3.5; // Compensate for gain loss
        }
    }
    return buffer;
}

function playNoise(type) {
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (noiseSource) noiseSource.stop();

    const buffer = createNoiseBuffer(type);
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    noiseSource.connect(gainNode);
    gainNode.gain.value = volumeSlider.value * 0.1; // Scale down so it's not too loud
    noiseSource.start();

    // UI Update
    soundBtns.forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-sound="${type}"]`).classList.add('active');
}

function stopNoise() {
    if (noiseSource) {
        noiseSource.stop();
        noiseSource = null;
    }
    soundBtns.forEach(b => b.classList.remove('active'));
}

soundBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'stop-sound') {
            stopNoise();
        } else {
            const type = btn.getAttribute('data-sound');
            playNoise(type);
        }
    });
});

volumeSlider.addEventListener('input', (e) => {
    if (gainNode) {
        gainNode.gain.value = e.target.value * 0.1;
    }
});

// 5. SCRATCHPAD (LocalStorage)
const scratchpad = document.getElementById('scratchpad');
scratchpad.value = localStorage.getItem('studentScratchpad') || '';

scratchpad.addEventListener('input', () => {
    localStorage.setItem('studentScratchpad', scratchpad.value);
});

// 6. THEME SWITCHER
const themeBtns = document.querySelectorAll('.theme-btn');
const savedTheme = localStorage.getItem('studentTheme') || 'mauve';
document.body.setAttribute('data-theme', savedTheme);

themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('studentTheme', theme);
    });
});
