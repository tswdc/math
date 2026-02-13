// Time Game Module

import { shuffleArray, showFeedbackOverlay, playFeedbackSound, fetchAiProblem, buildTimeAiPrompt } from './utils.js';

const realisticReadTemplates = {
    th: [
        ({ time }) => `รถโรงเรียนกำลังจะออกตอนนี้ ดูนาฬิกาแล้วตอบว่าเวลา ${time} ใช่ไหม?`,
        ({ time }) => `ถึงเวลาเข้าแถวหน้าเสาธง ดูนาฬิกาแล้วเลือกเวลาให้ตรง (${time})`,
        ({ time }) => `แม่บอกว่าได้เวลากินข้าวแล้ว นาฬิกาตอนนี้คือเวลา ${time} ใช่หรือไม่?`,
        ({ time }) => `กิจกรรมศิลปะเริ่มตอนนี้ อ่านนาฬิกาแล้วเลือกเวลา ${time}`
    ],
    en: [
        ({ time }) => `The school bus is leaving now. Read the clock and pick ${time}.`,
        ({ time }) => `Assembly starts now. Read the clock and choose the correct time (${time}).`,
        ({ time }) => `It is lunch time now. What time does the clock show? (${time})`,
        ({ time }) => `Art class starts now. Read the clock and choose ${time}.`
    ]
};

const realisticCompareTemplates = {
    th: {
        earlier: [
            ({ time1, time2 }) => `รถบัสรอบแรกออกเวลา ${time1} และรอบสองออกเวลา ${time2} เวลาไหนออกก่อน?`,
            ({ time1, time2 }) => `เริ่มอ่านหนังสือเวลา ${time1} และเริ่มทำการบ้านเวลา ${time2} เวลาไหนก่อน?`,
            ({ time1, time2 }) => `พักกลางวันเวลา ${time1} และเข้าเรียนต่อเวลา ${time2} เวลาไหนก่อน?`
        ],
        later: [
            ({ time1, time2 }) => `อาบน้ำเวลา ${time1} และเข้านอนเวลา ${time2} เวลาไหนหลัง?`,
            ({ time1, time2 }) => `ซ้อมฟุตบอลเวลา ${time1} และเลิกซ้อมเวลา ${time2} เวลาไหนหลัง?`,
            ({ time1, time2 }) => `ทานขนมเวลา ${time1} และทานอาหารเย็นเวลา ${time2} เวลาไหนหลัง?`
        ]
    },
    en: {
        earlier: [
            ({ time1, time2 }) => `Bus trip A leaves at ${time1} and trip B leaves at ${time2}. Which time is earlier?`,
            ({ time1, time2 }) => `Reading starts at ${time1} and homework starts at ${time2}. Which time is earlier?`,
            ({ time1, time2 }) => `Lunch is at ${time1} and afternoon class is at ${time2}. Which time is earlier?`
        ],
        later: [
            ({ time1, time2 }) => `Shower time is ${time1} and bedtime is ${time2}. Which time is later?`,
            ({ time1, time2 }) => `Practice starts at ${time1} and ends at ${time2}. Which time is later?`,
            ({ time1, time2 }) => `Snack time is ${time1} and dinner is ${time2}. Which time is later?`
        ]
    }
};

const durationActivities = {
    th: ['อบคุกกี้', 'อาบน้ำ', 'ทำการบ้าน', 'วาดรูป', 'เก็บห้อง', 'อ่านหนังสือ'],
    en: ['bake cookies', 'take a shower', 'do homework', 'draw a picture', 'clean the room', 'read a book']
};

const compareNames = {
    th: ['เจค', 'ซัลลี่', 'มีอา', 'โนอาห์', 'ลูน่า', 'แม็กซ์'],
    en: ['Jake', 'Sully', 'Mia', 'Noah', 'Luna', 'Max']
};

function pickRealisticReadPrompt(language, time) {
    const templates = realisticReadTemplates[language] || realisticReadTemplates.en;
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template({ time });
}

function pickRealisticComparePrompt(language, askEarlier, time1, time2) {
    const langTemplates = realisticCompareTemplates[language] || realisticCompareTemplates.en;
    const key = askEarlier ? 'earlier' : 'later';
    const templates = langTemplates[key];
    const template = templates[Math.floor(Math.random() * templates.length)];
    return template({ time1, time2 });
}

function formatDuration(totalMinutes, language) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if(language === 'th') {
        if(hours === 0) {
            return `${minutes} นาที`;
        }
        if(minutes === 0) {
            return `${hours} ชั่วโมง`;
        }
        return `${hours} ชั่วโมง ${minutes} นาที`;
    }

    if(hours === 0) {
        return `${minutes} mins`;
    }
    if(minutes === 0) {
        return `${hours} hr`;
    }
    return `${hours} hr ${minutes} mins`;
}

function buildDurationCompareQuestion(language, askQuicker, personA, activityA, durationA, personB, activityB, durationB) {
    if(language === 'th') {
        const questionTail = askQuicker ? 'ใครเสร็จเร็วกว่ากัน?' : 'ใครเสร็จช้ากว่ากัน?';
        return `${personA} ใช้เวลา${activityA} ${durationA} และ ${personB} ใช้เวลา${activityB} ${durationB} ${questionTail}`;
    }

    const questionTail = askQuicker ? 'Who will finish quicker?' : 'Who will finish later?';
    return `${personA} will ${activityA} for ${durationA}, and ${personB} will ${activityB} for ${durationB}. ${questionTail}`;
}

export async function startTimeGame(appState) {
    appState.scores.time = 0;
    appState.updateScore('time', 0);
    await generateTimeQuestion(appState);
}

export async function generateTimeQuestion(appState) {
    if(appState.isGenerating) {
        return;
    }

    appState.isGenerating = true;
    const abortSignal = appState.cancelPendingRequests();

    const feedback = document.getElementById('time-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';

    appState.currentQuestion = null;

    try {
        const useCompare = Math.random() < 0.3;
        if(useCompare) {
            setClockVisibility(false);
            const names = compareNames[appState.currentLanguage] || compareNames.en;
            const shuffledNames = [...names].sort(() => Math.random() - 0.5);
            const personA = shuffledNames[0];
            const personB = shuffledNames[1];

            const activities = durationActivities[appState.currentLanguage] || durationActivities.en;
            const activityA = activities[Math.floor(Math.random() * activities.length)];
            const activityB = activities[Math.floor(Math.random() * activities.length)];

            const durationChoices = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90];
            const total1 = durationChoices[Math.floor(Math.random() * durationChoices.length)];
            const total2 = durationChoices[Math.floor(Math.random() * durationChoices.length)];
            const duration1 = formatDuration(total1, appState.currentLanguage);
            const duration2 = formatDuration(total2, appState.currentLanguage);

            const sameLabel = appState.currentLanguage === 'th'
                ? `${appState.i18n.th.compareSame} / ${appState.i18n.en.compareSame}`
                : `${appState.i18n.en.compareSame} / ${appState.i18n.th.compareSame}`;

            const askQuicker = Math.random() > 0.5;
            const questionText = buildDurationCompareQuestion(
                appState.currentLanguage,
                askQuicker,
                personA,
                activityA,
                duration1,
                personB,
                activityB,
                duration2
            );

            document.getElementById('time-question').textContent = questionText;

            if(total1 === total2) {
                appState.currentAnswer = sameLabel;
            } else if(askQuicker) {
                appState.currentAnswer = total1 < total2 ? personA : personB;
            } else {
                appState.currentAnswer = total1 > total2 ? personA : personB;
            }

            appState.currentQuestion = {
                type: 'time-compare',
                options: [personA, personB, sameLabel]
            };

            generateTimeAnswers(appState, 12, 0);
            return;
        }

        setClockVisibility(true);
        const hours = Math.floor(Math.random() * 12) + 1;
        const minutes = Math.floor(Math.random() *60);

        setClockTime(hours, minutes);

        const timeEl = document.getElementById('time-question');
        const timeString = formatTime(hours, minutes);
        const fallback = pickRealisticReadPrompt(appState.currentLanguage, timeString);
        timeEl.textContent = appState.aiEnabled ? appState.i18n[appState.currentLanguage].loadingText : fallback;

        if(appState.aiEnabled) {
            try {
                timeEl.textContent = await fetchAiProblem(buildTimeAiPrompt(appState.currentLanguage, timeString, fallback), appState.geminiProxyUrl, abortSignal);
            } catch (error) {
                if(error.message !== 'Request timeout or cancelled') {
                    timeEl.textContent = fallback;
                }
            }
        }

        appState.currentAnswer = timeString;
        generateTimeAnswers(appState, hours, minutes);
    } finally {
        appState.isGenerating = false;
    }
}

function setClockVisibility(showClock) {
    const clockContainer = document.querySelector('#time-game .clock-container');
    if(!clockContainer) {
        return;
    }

    clockContainer.style.display = showClock ? '' : 'none';
}

function setClockTime(hours, minutes) {
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    
    const minuteAngle = (minutes * 6) - 90;
    const hourAngle = ((hours % 12) * 30) + (minutes * 0.5) - 90;
    
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

export function formatTime(hours, minutes) {
    const h = hours === 0 ? 12 : hours;
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
}

function generateTimeAnswers(appState, correctHours, correctMinutes) {
    const correctTime = formatTime(correctHours, correctMinutes);
    const isCompare = appState.currentQuestion && appState.currentQuestion.type === 'time-compare';
    const answers = isCompare ? appState.currentQuestion.options : [correctTime];
    
    while(!isCompare && answers.length < 4) {
        let wrongHours = correctHours + (Math.floor(Math.random() * 5) - 2);
        let wrongMinutes = correctMinutes;
        
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
    
    if(!isCompare) {
        shuffleArray(answers);
    }
    
    const answersContainer = document.getElementById('time-answers');
    answersContainer.innerHTML = '';
    
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkTimeAnswer(appState, answer);
        answersContainer.appendChild(btn);
    });
}

function checkTimeAnswer(appState, selectedAnswer) {
    // Prevent multiple simultaneous checks
    if(appState.isAnswering) {
        return;
    }
    appState.isAnswering = true;
    
    const buttons = document.querySelectorAll('#time-answers .answer-btn');
    const feedback = document.getElementById('time-feedback');
    
    buttons.forEach(btn => btn.disabled = true);
    
    if(selectedAnswer === appState.currentAnswer) {
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        showFeedbackOverlay('correct', appState);
        appState.audioContext = playFeedbackSound('correct', appState.audioContext);
        appState.updateScore('time', 10);
        
        buttons.forEach(btn => {
            if(btn.textContent === appState.currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            appState.isAnswering = false;
            generateTimeQuestion(appState);
        }, 1500);
    } else {
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        showFeedbackOverlay('wrong', appState);
        appState.audioContext = playFeedbackSound('wrong', appState.audioContext);
        
        buttons.forEach(btn => {
            if(btn.textContent === selectedAnswer) {
                btn.classList.add('wrong');
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
        
        appState.isAnswering = false;
    }
}
