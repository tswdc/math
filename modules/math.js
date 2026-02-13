// Math Game Module

import { shuffleArray, showFeedbackOverlay, playFeedbackSound, fetchAiProblem, buildMathAiPrompt } from './utils.js';

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

export async function startMathGame(appState) {
    appState.scores.math = 0;
    appState.updateScore('math', 0);
    await generateMathQuestion(appState);
}

export async function generateMathQuestion(appState) {
    if(appState.isGenerating) {
        return;
    }
    
    appState.isGenerating = true;
    const abortSignal = appState.cancelPendingRequests();
    
    const feedback = document.getElementById('math-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';
    
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
    
    const useWordProblem = Math.random() < 0.4;
    if(useWordProblem) {
        const templates = mathWordProblemTemplates[appState.currentLanguage][operation];
        const pick = templates[Math.floor(Math.random() * templates.length)];
        const questionEl = document.getElementById('math-question');
        questionEl.textContent = appState.aiEnabled ? appState.i18n[appState.currentLanguage].loadingText : pick(num1, num2);

        if(appState.aiEnabled) {
            try {
                const prompt = buildMathAiPrompt(operation, num1, num2, appState.currentLanguage);
                const aiText = await fetchAiProblem(prompt, appState.geminiProxyUrl, abortSignal);
                questionEl.textContent = aiText;
            } catch (error) {
                if(error.message !== 'Request timeout or cancelled') {
                    questionEl.textContent = pick(num1, num2);
                }
            }
        }
    } else {
        document.getElementById('math-question').textContent = mathStandardPrompt(num1, num2, operation);
    }
    appState.currentAnswer = correctAnswer;
    
    generateMathAnswers(appState, correctAnswer);
    appState.isGenerating = false;
}

function generateMathAnswers(appState, correctAnswer) {
    const answers = [correctAnswer];
    
    while(answers.length < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        const wrongAnswer = correctAnswer + offset;
        
        if(wrongAnswer !== correctAnswer && wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
            answers.push(wrongAnswer);
        }
    }
    
    shuffleArray(answers);
    
    const answersContainer = document.getElementById('math-answers');
    answersContainer.innerHTML = '';
    
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.onclick = () => checkMathAnswer(appState, answer);
        answersContainer.appendChild(btn);
    });
}

function checkMathAnswer(appState, selectedAnswer) {
    // Prevent multiple simultaneous checks
    if(appState.isAnswering) {
        return;
    }
    appState.isAnswering = true;
    
    const buttons = document.querySelectorAll('#math-answers .answer-btn');
    const feedback = document.getElementById('math-feedback');
    
    buttons.forEach(btn => btn.disabled = true);
    
    if(selectedAnswer === appState.currentAnswer) {
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        showFeedbackOverlay('correct', appState);
        appState.audioContext = playFeedbackSound('correct', appState.audioContext);
        appState.updateScore('math', 10);
        
        buttons.forEach(btn => {
            if(parseInt(btn.textContent) === appState.currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            appState.isAnswering = false;
            generateMathQuestion(appState);
        }, 1500);
    } else {
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        showFeedbackOverlay('wrong', appState);
        appState.audioContext = playFeedbackSound('wrong', appState.audioContext);
        
        buttons.forEach(btn => {
            if(parseInt(btn.textContent) === selectedAnswer) {
                btn.classList.add('wrong');
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
        
        appState.isAnswering = false;
    }
}
