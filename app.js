// Import game modules
import { startMathGame } from './modules/math.js';
import { startWeightGame } from './modules/weight.js';
import { startTimeGame } from './modules/time.js';

// Internationalization
const i18n = {
    th: {
        title: '🎮 เกมฝึกคณิตศาสตร์ 🎮',
        subtitle: 'เกมคณิตศาสตร์สนุกๆ',
        menuMath: 'คณิตพื้นฐาน',
        menuMathDesc: 'ฝึกบวก ลบ คูณ หาร',
        menuWeight: 'แปลงหน่วยน้ำหนัก',
        menuWeightDesc: 'กิโลกรัม กรัม และ ขีด',
        menuTime: 'เวลาและนาฬิกา',
        menuTimeDesc: 'อ่านเวลาจากนาฬิกา',
        scoreLabel: 'คะแนน:',
        menuBack: '🏠 เมนู',
        aiLabel: 'โจทย์ปัญหาแบบ AI',
        loadingText: 'กำลังคิดโจทย์...',
        compareQuestion: 'อันไหนหนักกว่า?',
        compareSame: 'เท่ากัน',
        timeCompareEarlier: 'เวลาไหนก่อน?',
        timeCompareLater: 'เวลาไหนหลัง?',
        timePrompts: [
            'กี่โมงแล้ว?',
            'ถึงเวลาเข้าเรียนแล้ว ดูนาฬิกาแล้วตอบเวลา',
            'ได้เวลากินขนม นาฬิกาบอกเวลาอะไร?',
            'รถไฟกำลังออก นาฬิกาเป็นเวลาอะไร?'
        ]
    },
    en: {
        title: '🎮 Math Learning Games 🎮',
        subtitle: 'Fun math games for kids',
        menuMath: 'Basic Math',
        menuMathDesc: 'Practice +, -, ×, ÷',
        menuWeight: 'Weight Conversion',
        menuWeightDesc: 'kg, g, and khit',
        menuTime: 'Time & Clock',
        menuTimeDesc: 'Read the clock',
        scoreLabel: 'Score:',
        menuBack: '🏠 Menu',
        aiLabel: 'AI word problems',
        loadingText: 'Generating problem...',
        compareQuestion: 'Which is heavier?',
        compareSame: 'Same',
        timeCompareEarlier: 'Which time is earlier?',
        timeCompareLater: 'Which time is later?',
        timePrompts: [
            'What time is it?',
            'School starts now. Read the clock.',
            'Snack time! What time does the clock show?',
            'A train leaves now. What time is shown?'
        ]
    }
};

const weightUnits = {
    th: {
        kg: 'กิโลกรัม',
        g: 'กรัม',
        khit: 'ขีด'
    },
    en: {
        kg: 'kg',
        g: 'g',
        khit: 'khit'
    }
};

// Global application state
const appState = {
    currentGame: null,
    scores: {
        math: 0,
        weight: 0,
        time: 0
    },
    currentLanguage: 'th',
    aiEnabled: true,
    geminiProxyUrl: '/api/gemini',
    currentQuestion: null,
    currentAnswer: null,
    audioContext: null,
    overlayTimeoutId: null,
    i18n: i18n,
    weightUnits: weightUnits,
    abortController: null,
    isGenerating: false,
    isAnswering: false,
    updateScore(gameType, points) {
        this.scores[gameType] += points;
        document.getElementById(`${gameType}-score`).textContent = this.scores[gameType];
    },
    cancelPendingRequests() {
        if(this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();
        return this.abortController.signal;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderClockTicks();
    setupLanguageSelector();
    setupAiToggle();
    setLanguage(appState.currentLanguage);
});

// Language selector setup
function setupLanguageSelector() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });
}

// AI toggle setup
function setupAiToggle() {
    const toggle = document.getElementById('ai-toggle');
    if(!toggle) {
        return;
    }

    toggle.checked = appState.aiEnabled;
    toggle.addEventListener('change', () => {
        appState.aiEnabled = toggle.checked;
    });
}

// Set language and update UI
function setLanguage(lang) {
    if(!i18n[lang]) {
        return;
    }

    appState.currentLanguage = lang;
    document.documentElement.setAttribute('lang', lang);

    const translations = i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if(translations[key]) {
            element.textContent = translations[key];
        }
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// Render clock ticks (hours and minutes)
function renderClockTicks() {
    const tickGroup = document.getElementById('clock-ticks');
    if(!tickGroup) {
        return;
    }

    tickGroup.innerHTML = '';

    const centerX = 100;
    const centerY = 100;
    const minuteOuterRadius = 92;
    const minuteInnerRadius = 86;
    const hourInnerRadius = 80;

    for(let i = 0; i < 60; i++) {
        const angle = (i * 6 - 90) * Math.PI / 180;
        const isHourTick = i % 5 === 0;
        const innerRadius = isHourTick ? hourInnerRadius : minuteInnerRadius;

        const x1 = centerX + innerRadius * Math.cos(angle);
        const y1 = centerY + innerRadius * Math.sin(angle);
        const x2 = centerX + minuteOuterRadius * Math.cos(angle);
        const y2 = centerY + minuteOuterRadius * Math.sin(angle);

        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tick.setAttribute('x1', x1);
        tick.setAttribute('y1', y1);
        tick.setAttribute('x2', x2);
        tick.setAttribute('y2', y2);
        tick.setAttribute('class', isHourTick ? 'hour-tick' : 'minute-tick');
        tickGroup.appendChild(tick);
    }
}

// Start a game module
function startGame(gameType) {
    appState.currentGame = gameType;
    hideAllScreens();
    
    switch(gameType) {
        case 'math':
            document.getElementById('math-game').classList.add('active');
            startMathGame(appState);
            break;
        case 'weight':
            document.getElementById('weight-game').classList.add('active');
            startWeightGame(appState);
            break;
        case 'time':
            document.getElementById('time-game').classList.add('active');
            startTimeGame(appState);
            break;
    }
}

// Return to main menu
function backToMenu() {
    hideAllScreens();
    document.getElementById('main-menu').classList.add('active');
    appState.currentGame = null;
}

// Hide all screen divs
function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
}

// Expose functions to global scope for HTML onclick handlers
window.startGame = startGame;
window.backToMenu = backToMenu;
