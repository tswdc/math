// Global variables
let currentGame = null;
let scores = {
    math: 0,
    weight: 0,
    time: 0
};

let currentLanguage = 'th';

// Game state
let currentQuestion = null;
let currentAnswer = null;
let audioContext = null;
let overlayTimeoutId = null;

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
        compareQuestion: 'อันไหนหนักกว่า?',
        compareSame: 'เท่ากัน',
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
        compareQuestion: 'Which is heavier?',
        compareSame: 'Same',
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

document.addEventListener('DOMContentLoaded', () => {
    renderClockTicks();
    setupLanguageSelector();
    setLanguage(currentLanguage);
});

function setupLanguageSelector() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    if(!i18n[lang]) {
        return;
    }

    currentLanguage = lang;
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

// ==================== Main App Functions ====================

function startGame(gameType) {
    currentGame = gameType;
    hideAllScreens();
    
    switch(gameType) {
        case 'math':
            document.getElementById('math-game').classList.add('active');
            startMathGame();
            break;
        case 'weight':
            document.getElementById('weight-game').classList.add('active');
            startWeightGame();
            break;
        case 'time':
            document.getElementById('time-game').classList.add('active');
            startTimeGame();
            break;
    }
}

function backToMenu() {
    hideAllScreens();
    document.getElementById('main-menu').classList.add('active');
    currentGame = null;
}

function hideAllScreens() {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
}

function updateScore(gameType, points) {
    scores[gameType] += points;
    document.getElementById(`${gameType}-score`).textContent = scores[gameType];
}

function showFeedbackOverlay(type) {
    const overlay = document.getElementById('feedback-overlay');
    const image = document.getElementById('feedback-image');

    if(!overlay || !image) {
        return;
    }

    image.src = type === 'correct' ? 'assets/correct.svg' : 'assets/wrong.svg';
    overlay.classList.remove('correct', 'wrong', 'show');
    overlay.classList.add(type);

    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });

    if(overlayTimeoutId) {
        clearTimeout(overlayTimeoutId);
    }

    overlayTimeoutId = setTimeout(() => {
        overlay.classList.remove('show');
    }, 700);
}

function playFeedbackSound(type) {
    if(!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    gain.connect(audioContext.destination);

    const osc1 = audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.connect(gain);

    if(type === 'correct') {
        osc1.frequency.setValueAtTime(660, now);
        const osc2 = audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.08);
        osc2.connect(gain);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.25);
    } else {
        osc1.frequency.setValueAtTime(220, now);
    }

    osc1.start(now);
    osc1.stop(now + 0.25);
}

// ==================== Basic Math Game ====================

const mathOperations = ['+', '-', '*', '/'];
const mathWordProblemTemplates = {
    th: {
        '+': [
            (a, b) => `มีแอปเปิล ${a} ลูก ได้เพิ่มอีก ${b} ลูก รวมทั้งหมดกี่ลูก?`,
            (a, b) => `มีลูกบอล ${a} ลูก มีเพิ่มมาอีก ${b} ลูก ตอนนี้มีทั้งหมดกี่ลูก?`
        ],
        '-': [
            (a, b) => `มีคุกกี้ ${a} ชิ้น กินไป ${b} ชิ้น เหลือกี่ชิ้น?`,
            (a, b) => `มีดินสอ ${a} แท่ง เอาออกไป ${b} แท่ง เหลือกี่แท่ง?`
        ],
        '*': [
            (a, b) => `มีถุง ${a} ใบ แต่ละถุงมีลูกแก้ว ${b} เม็ด รวมทั้งหมดกี่เม็ด?`,
            (a, b) => `มีโต๊ะ ${a} โต๊ะ โต๊ะละ ${b} แก้ว รวมทั้งหมดกี่แก้ว?`
        ],
        '/': [
            (a, b) => `มีลูกอม ${a} เม็ด แบ่งให้เด็ก ${b} คนเท่าๆ กัน เด็กแต่ละคนได้กี่เม็ด?`,
            (a, b) => `มีสติ๊กเกอร์ ${a} ดวง แบ่งเป็น ${b} กลุ่มเท่าๆ กัน กลุ่มละกี่ดวง?`
        ]
    },
    en: {
        '+': [
            (a, b) => `Mia has ${a} apples and gets ${b} more. How many apples now?`,
            (a, b) => `There are ${a} balloons. ${b} more balloons arrive. Total balloons?`
        ],
        '-': [
            (a, b) => `There are ${a} cookies. ${b} are eaten. How many left?`,
            (a, b) => `A box has ${a} pencils. ${b} are taken away. How many remain?`
        ],
        '*': [
            (a, b) => `${a} bags have ${b} marbles each. How many marbles?`,
            (a, b) => `There are ${a} tables with ${b} cups each. Total cups?`
        ],
        '/': [
            (a, b) => `${a} candies are shared among ${b} kids. Each kid gets how many?`,
            (a, b) => `Divide ${a} stickers into ${b} groups. Stickers per group?`
        ]
    }
};
const mathStandardPrompt = (a, b, op) => `${a} ${op} ${b} = ?`;

function startMathGame() {
    scores.math = 0;
    updateScore('math', 0);
    generateMathQuestion();
}

function generateMathQuestion() {
    // Clear feedback
    const feedback = document.getElementById('math-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
    
    // Generate random numbers and operation
    const operation = mathOperations[Math.floor(Math.random() * mathOperations.length)];
    let num1, num2, correctAnswer;
    
    switch(operation) {
        case '+':
            num1 = Math.floor(Math.random() * 50) + 1;
            num2 = Math.floor(Math.random() * 50) + 1;
            correctAnswer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 50) + 20;
            num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
            correctAnswer = num1 - num2;
            break;
        case '*':
            num1 = Math.floor(Math.random() * 12) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
            correctAnswer = num1 * num2;
            break;
        case '/':
            num2 = Math.floor(Math.random() * 10) + 2;
            correctAnswer = Math.floor(Math.random() * 10) + 1;
            num1 = num2 * correctAnswer;
            break;
    }
    
    // Display question (sometimes as word problem)
    const useWordProblem = Math.random() < 0.4;
    if(useWordProblem) {
        const templates = mathWordProblemTemplates[currentLanguage][operation];
        const pick = templates[Math.floor(Math.random() * templates.length)];
        document.getElementById('math-question').textContent = pick(num1, num2);
    } else {
        document.getElementById('math-question').textContent = mathStandardPrompt(num1, num2, operation);
    }
    currentAnswer = correctAnswer;
    
    // Generate answer options
    generateMathAnswers(correctAnswer);
}

function generateMathAnswers(correctAnswer) {
    const answers = [correctAnswer];
    
    // Generate 3 wrong answers
    while(answers.length < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        const wrongAnswer = correctAnswer + offset;
        
        if(wrongAnswer !== correctAnswer && wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
            answers.push(wrongAnswer);
        }
    }
    
    // Shuffle answers
    shuffleArray(answers);
    
    // Display answer buttons
    const answersContainer = document.getElementById('math-answers');
    answersContainer.innerHTML = '';
    
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkMathAnswer(answer);
        answersContainer.appendChild(btn);
    });
}

function checkMathAnswer(selectedAnswer) {
    const buttons = document.querySelectorAll('#math-answers .answer-btn');
    const feedback = document.getElementById('math-feedback');
    
    // Disable all buttons
    buttons.forEach(btn => btn.disabled = true);
    
    if(selectedAnswer === currentAnswer) {
        // Correct answer
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        showFeedbackOverlay('correct');
        playFeedbackSound('correct');
        updateScore('math', 10);
        
        // Highlight correct button
        buttons.forEach(btn => {
            if(parseInt(btn.textContent) === currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // Next question after delay
        setTimeout(() => {
            generateMathQuestion();
        }, 1500);
    } else {
        // Wrong answer
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        showFeedbackOverlay('wrong');
        playFeedbackSound('wrong');
        
        // Highlight wrong button
        buttons.forEach(btn => {
            if(parseInt(btn.textContent) === selectedAnswer) {
                btn.classList.add('wrong');
            } else if(parseInt(btn.textContent) === currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // Next question after delay
        setTimeout(() => {
            generateMathQuestion();
        }, 2000);
    }
}

// ==================== Weight Conversion Game ====================

function startWeightGame() {
    scores.weight = 0;
    updateScore('weight', 0);
    generateWeightQuestion();
}

function generateWeightQuestion() {
    // Clear feedback
    const feedback = document.getElementById('weight-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';

    currentQuestion = null;
    
    // Thai weight unit: 1 ขีด (khit) = 100 grams
    // Question types:
    // 1. kg to g
    // 2. g to kg
    // 3. ขีด to g
    // 4. g to ขีด
    // 5. Compare weights
    
    const questionType = Math.floor(Math.random() * 6);
    let questionText, correctAnswer;
    const units = weightUnits[currentLanguage];
    
    switch(questionType) {
        case 0: // kg to g
            const kg = Math.floor(Math.random() * 5) + 1;
            questionText = `${kg} ${units.kg} = ? ${units.g}`;
            correctAnswer = kg * 1000;
            break;
        case 1: // g to kg
            const g = (Math.floor(Math.random() * 5) + 1) * 1000;
            questionText = `${g} ${units.g} = ? ${units.kg}`;
            correctAnswer = g / 1000;
            break;
        case 2: // ขีด to g
            const khit = Math.floor(Math.random() * 10) + 1;
            questionText = `${khit} ${units.khit} = ? ${units.g}`;
            correctAnswer = khit * 100;
            break;
        case 3: // g to ขีด
            const grams = (Math.floor(Math.random() * 10) + 1) * 100;
            questionText = `${grams} ${units.g} = ? ${units.khit}`;
            correctAnswer = grams / 100;
            break;
        case 4: // Compare weights
            const weight1 = Math.floor(Math.random() * 500) + 100;
            const weight2 = Math.floor(Math.random() * 500) + 100;
            const unit1 = Math.random() > 0.5 ? 'g' : 'khit';
            const unit2 = Math.random() > 0.5 ? 'g' : 'khit';
            
            const w1InGrams = unit1 === 'g' ? weight1 : weight1 * 100;
            const w2InGrams = unit2 === 'g' ? weight2 : weight2 * 100;
            const option1 = `${weight1} ${units[unit1]}`;
            const option2 = `${weight2} ${units[unit2]}`;
            const sameLabel = currentLanguage === 'th'
                ? `${i18n.th.compareSame} / ${i18n.en.compareSame}`
                : `${i18n.en.compareSame} / ${i18n.th.compareSame}`;
            
            if(w1InGrams > w2InGrams) {
                questionText = currentLanguage === 'th'
                    ? `${i18n.th.compareQuestion} / ${i18n.en.compareQuestion}`
                    : `${i18n.en.compareQuestion} / ${i18n.th.compareQuestion}`;
                correctAnswer = option1;
            } else if(w2InGrams > w1InGrams) {
                questionText = currentLanguage === 'th'
                    ? `${i18n.th.compareQuestion} / ${i18n.en.compareQuestion}`
                    : `${i18n.en.compareQuestion} / ${i18n.th.compareQuestion}`;
                correctAnswer = option2;
            } else {
                questionText = currentLanguage === 'th'
                    ? `${i18n.th.compareQuestion} / ${i18n.en.compareQuestion}`
                    : `${i18n.en.compareQuestion} / ${i18n.th.compareQuestion}`;
                correctAnswer = sameLabel;
            }
            
            // Store comparison options
            currentQuestion = {
                type: 'compare',
                options: [option1, option2, sameLabel]
            };
            break;
        case 5: { // Word problem
            const scenarioType = Math.floor(Math.random() * 3);
            if(scenarioType === 0) {
                const kg = Math.floor(Math.random() * 4) + 1;
                questionText = currentLanguage === 'th'
                    ? `ตะกร้าหนัก ${kg} กิโลกรัม เท่ากับกี่กรัม?`
                    : `A basket weighs ${kg} kg. How many grams is that?`;
                correctAnswer = kg * 1000;
            } else if(scenarioType === 1) {
                const khit = Math.floor(Math.random() * 8) + 2;
                questionText = currentLanguage === 'th'
                    ? `แม่ซื้อผลไม้ ${khit} ขีด เท่ากับกี่กรัม?`
                    : `Mom buys ${khit} khit of fruit. How many grams is that?`;
                correctAnswer = khit * 100;
            } else {
                const grams = (Math.floor(Math.random() * 8) + 2) * 100;
                questionText = currentLanguage === 'th'
                    ? `ขนมหนัก ${grams} กรัม เท่ากับกี่ขีด?`
                    : `A snack is ${grams} g. How many khit is that?`;
                correctAnswer = grams / 100;
            }
            break;
        }
    }
    
    document.getElementById('weight-question').textContent = questionText;
    currentAnswer = correctAnswer;
    
    generateWeightAnswers(correctAnswer, questionType);
}

function generateWeightAnswers(correctAnswer, questionType) {
    let answers;
    let unitLabel = '';
    const units = weightUnits[currentLanguage];

    switch(questionType) {
        case 0:
            unitLabel = units.g;
            break;
        case 1:
            unitLabel = units.kg;
            break;
        case 2:
            unitLabel = units.g;
            break;
        case 3:
            unitLabel = units.khit;
            break;
    }
    
    if(questionType === 4) {
        // For comparison questions
        answers = currentQuestion.options;
    } else {
        answers = [correctAnswer];
        
        // Generate wrong answers
        while(answers.length < 4) {
            let wrongAnswer;
            if(correctAnswer < 10) {
                wrongAnswer = correctAnswer + (Math.floor(Math.random() * 6) - 3);
            } else if(correctAnswer < 100) {
                wrongAnswer = correctAnswer + (Math.floor(Math.random() * 40) - 20);
            } else {
                wrongAnswer = correctAnswer + (Math.floor(Math.random() * 400) - 200);
            }
            
            if(wrongAnswer !== correctAnswer && wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }
        
        shuffleArray(answers);
    }
    
    // Display answer buttons
    const answersContainer = document.getElementById('weight-answers');
    answersContainer.innerHTML = '';
    
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.dataset.value = answer;
        btn.textContent = questionType === 4 ? answer : `${answer} ${unitLabel}`;
        btn.onclick = () => checkWeightAnswer(answer);
        answersContainer.appendChild(btn);
    });
}

function checkWeightAnswer(selectedAnswer) {
    const buttons = document.querySelectorAll('#weight-answers .answer-btn');
    const feedback = document.getElementById('weight-feedback');

    const isCompare = currentQuestion && currentQuestion.type === 'compare';
    
    buttons.forEach(btn => btn.disabled = true);
    
    const isCorrect = isCompare
        ? selectedAnswer === currentAnswer
        : Number(selectedAnswer) === Number(currentAnswer);
    
    if(isCorrect) {
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        showFeedbackOverlay('correct');
        playFeedbackSound('correct');
        updateScore('weight', 10);
        
        buttons.forEach(btn => {
            const value = isCompare ? btn.dataset.value : Number(btn.dataset.value);
            if(value === currentAnswer || value === Number(currentAnswer)) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            generateWeightQuestion();
        }, 1500);
    } else {
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        showFeedbackOverlay('wrong');
        playFeedbackSound('wrong');
        
        buttons.forEach(btn => {
            const value = isCompare ? btn.dataset.value : Number(btn.dataset.value);
            const normalizedSelected = isCompare ? selectedAnswer : Number(selectedAnswer);
            if(value === normalizedSelected) {
                btn.classList.add('wrong');
            } else if(value === currentAnswer || value === Number(currentAnswer)) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            generateWeightQuestion();
        }, 2000);
    }
}

// ==================== Time & Clock Game ====================

function startTimeGame() {
    scores.time = 0;
    updateScore('time', 0);
    generateTimeQuestion();
}

function generateTimeQuestion() {
    // Clear feedback
    const feedback = document.getElementById('time-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
    
    // Generate random time (on the hour or half hour for simplicity)
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.random() > 0.5 ? 0 : 30;
    
    // Set clock hands
    setClockTime(hours, minutes);
    
    // Create question
    const timePrompts = i18n[currentLanguage].timePrompts;
    document.getElementById('time-question').textContent = timePrompts[Math.floor(Math.random() * timePrompts.length)];
    
    // Store correct answer
    const timeString = formatTime(hours, minutes);
    currentAnswer = timeString;
    
    generateTimeAnswers(hours, minutes);
}

function setClockTime(hours, minutes) {
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    
    // Calculate angles (12 o'clock is 0 degrees)
    const minuteAngle = (minutes * 6) - 90; // 6 degrees per minute, -90 to start at 12
    const hourAngle = ((hours % 12) * 30) + (minutes * 0.5) - 90; // 30 degrees per hour, 0.5 per minute
    
    // Set hand positions
    const hourLength = 40;
    const minuteLength = 60;
    
    const hourX = 100 + hourLength * Math.cos(hourAngle * Math.PI / 180);
    const hourY = 100 + hourLength * Math.sin(hourAngle * Math.PI / 180);
    
    const minuteX = 100 + minuteLength * Math.cos(minuteAngle * Math.PI / 180);
    const minuteY = 100 + minuteLength * Math.sin(minuteAngle * Math.PI / 180);
    
    hourHand.setAttribute('x2', hourX);
    hourHand.setAttribute('y2', hourY);
    
    minuteHand.setAttribute('x2', minuteX);
    minuteHand.setAttribute('y2', minuteY);
}

function formatTime(hours, minutes) {
    const h = hours === 0 ? 12 : hours;
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
}

function generateTimeAnswers(correctHours, correctMinutes) {
    const correctTime = formatTime(correctHours, correctMinutes);
    const answers = [correctTime];
    
    // Generate wrong answers
    while(answers.length < 4) {
        let wrongHours = correctHours + (Math.floor(Math.random() * 5) - 2);
        let wrongMinutes = correctMinutes;
        
        // Sometimes change minutes too
        if(Math.random() > 0.5) {
            wrongMinutes = wrongMinutes === 0 ? 30 : 0;
        }
        
        if(wrongHours < 1) wrongHours = 12;
        if(wrongHours > 12) wrongHours = 1;
        
        const wrongTime = formatTime(wrongHours, wrongMinutes);
        
        if(wrongTime !== correctTime && !answers.includes(wrongTime)) {
            answers.push(wrongTime);
        }
    }
    
    shuffleArray(answers);
    
    // Display answer buttons
    const answersContainer = document.getElementById('time-answers');
    answersContainer.innerHTML = '';
    
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkTimeAnswer(answer);
        answersContainer.appendChild(btn);
    });
}

function checkTimeAnswer(selectedAnswer) {
    const buttons = document.querySelectorAll('#time-answers .answer-btn');
    const feedback = document.getElementById('time-feedback');
    
    buttons.forEach(btn => btn.disabled = true);
    
    if(selectedAnswer === currentAnswer) {
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        showFeedbackOverlay('correct');
        playFeedbackSound('correct');
        updateScore('time', 10);
        
        buttons.forEach(btn => {
            if(btn.textContent === currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            generateTimeQuestion();
        }, 1500);
    } else {
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        showFeedbackOverlay('wrong');
        playFeedbackSound('wrong');
        
        buttons.forEach(btn => {
            if(btn.textContent === selectedAnswer) {
                btn.classList.add('wrong');
            } else if(btn.textContent === currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            generateTimeQuestion();
        }, 2000);
    }
}

// ==================== Utility Functions ====================

function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
