// Weight Conversion Game Module

import { shuffleArray, showFeedbackOverlay, playFeedbackSound, fetchAiProblem, buildWeightAiPrompt } from './utils.js';

export async function startWeightGame(appState) {
    appState.scores.weight = 0;
    appState.updateScore('weight', 0);
    await generateWeightQuestion(appState);
}

export async function generateWeightQuestion(appState) {
    if(appState.isGenerating) {
        return;
    }
    
    appState.isGenerating = true;
    appState.cancelPendingRequests();
    
    console.log('Generating weight question...');
    const feedback = document.getElementById('weight-feedback');
    feedback.textContent = '';
    feedback.className = 'feedback';

    appState.currentQuestion = null;
    
    const questionType = Math.floor(Math.random() * 4) + 4;
    let questionText, correctAnswer;
    const units = appState.weightUnits[appState.currentLanguage];

    try {
    switch(questionType) {
        case 0:
            const kg = Math.floor(Math.random() * 5) + 1;
            questionText = `${kg} ${units.kg} = ? ${units.g}`;
            correctAnswer = kg * 1000;
            break;
        case 1:
            const g = (Math.floor(Math.random() * 5) + 1) * 1000;
            questionText = `${g} ${units.g} = ? ${units.kg}`;
            correctAnswer = g / 1000;
            break;
        case 2:
            const khit = Math.floor(Math.random() * 10) + 1;
            questionText = `${khit} ${units.khit} = ? ${units.g}`;
            correctAnswer = khit * 100;
            break;
        case 3:
            const grams = (Math.floor(Math.random() * 10) + 1) * 100;
            questionText = `${grams} ${units.g} = ? ${units.khit}`;
            correctAnswer = grams / 100;
            break;
        case 4:
            questionText = await handleWeightCompare(appState, units);
            correctAnswer = appState.currentAnswer || 0;
            break;
        case 5:
            await handleWeightWordProblem(appState, units);
            correctAnswer = appState.currentAnswer || 0;
            break;
        case 6:
            await handleWeightComparisonWord(appState, units);
            correctAnswer = appState.currentAnswer || 0;
            break;
        case 7:
            await handleComplexWeightComparison(appState, units);
            correctAnswer = appState.currentAnswer || 0;
            break;
        default:
            questionText = await handleWeightCompare(appState, units);
            correctAnswer = appState.currentAnswer || 0;
            break;
    }
    
    if((questionType !== 5 && questionType !== 6 && questionType !== 7) || !appState.aiEnabled) {
        document.getElementById('weight-question').textContent = questionText;
    }
    appState.currentAnswer = correctAnswer;
    
    generateWeightAnswers(appState, correctAnswer, questionType);
    } finally {
        appState.isGenerating = false;
    }
}

function handleWeightCompare(appState, units) {
    const weight1 = Math.floor(Math.random() * 500) + 100;
    const weight2 = Math.floor(Math.random() * 500) + 100;
    const unit1 = Math.random() > 0.5 ? 'g' : 'khit';
    const unit2 = Math.random() > 0.5 ? 'g' : 'khit';
    
    const w1InGrams = unit1 === 'g' ? weight1 : weight1 * 100;
    const w2InGrams = unit2 === 'g' ? weight2 : weight2 * 100;
    const option1 = `${weight1} ${units[unit1]}`;
    const option2 = `${weight2} ${units[unit2]}`;
    const sameLabel = appState.currentLanguage === 'th'
        ? `${appState.i18n.th.compareSame} / ${appState.i18n.en.compareSame}`
        : `${appState.i18n.en.compareSame} / ${appState.i18n.th.compareSame}`;
    
    let questionText = appState.currentLanguage === 'th'
        ? `${appState.i18n.th.compareQuestion} / ${appState.i18n.en.compareQuestion}`
        : `${appState.i18n.en.compareQuestion} / ${appState.i18n.th.compareQuestion}`;
    
    if(w1InGrams > w2InGrams) {
        appState.currentAnswer = option1;
    } else if(w2InGrams > w1InGrams) {
        appState.currentAnswer = option2;
    } else {
        appState.currentAnswer = sameLabel;
    }
    
    appState.currentQuestion = {
        type: 'compare',
        options: [option1, option2, sameLabel]
    };
    
    return questionText;
}

async function handleWeightWordProblem(appState, units) {
    const scenarioType = Math.floor(Math.random() * 3);
    const questionEl = document.getElementById('weight-question');
    const abortSignal = appState.abortController ? appState.abortController.signal : null;
    let questionText, correctAnswer;
    
    if(scenarioType === 0) {
        const kg = Math.floor(Math.random() * 4) + 1;
        questionText = appState.currentLanguage === 'th'
            ? `ตะกร้าหนัก ${kg} กิโลกรัม เท่ากับกี่กรัม?`
            : `A basket weighs ${kg} kg. How many grams is that?`;
        correctAnswer = kg * 1000;
        if(appState.aiEnabled) {
            questionEl.textContent = appState.i18n[appState.currentLanguage].loadingText;
            const scenario = `Use ${kg} ${units.kg} and ask to convert to ${units.g}.`;
            try {
                questionEl.textContent = await fetchAiProblem(buildWeightAiPrompt(scenario, appState.currentLanguage), appState.geminiProxyUrl, abortSignal);
            } catch (error) {
                if(error.message !== 'Request timeout or cancelled') {
                    questionEl.textContent = questionText;
                }
            }
        }
    } else if(scenarioType === 1) {
        const khit = Math.floor(Math.random() * 8) + 2;
        questionText = appState.currentLanguage === 'th'
            ? `แม่ซื้อผลไม้ ${khit} ขีด เท่ากับกี่กรัม?`
            : `Mom buys ${khit} khit of fruit. How many grams is that?`;
        correctAnswer = khit * 100;
        if(appState.aiEnabled) {
            questionEl.textContent = appState.i18n[appState.currentLanguage].loadingText;
            const scenario = `Use ${khit} ${units.khit} and ask to convert to ${units.g}.`;
            try {
                questionEl.textContent = await fetchAiProblem(buildWeightAiPrompt(scenario, appState.currentLanguage), appState.geminiProxyUrl, abortSignal);
            } catch (error) {
                if(error.message !== 'Request timeout or cancelled') {
                    questionEl.textContent = questionText;
                }
            }
        }
    } else {
        const grams = (Math.floor(Math.random() * 8) + 2) * 100;
        questionText = appState.currentLanguage === 'th'
            ? `ขนมหนัก ${grams} กรัม เท่ากับกี่ขีด?`
            : `A snack is ${grams} g. How many khit is that?`;
        correctAnswer = grams / 100;
        if(appState.aiEnabled) {
            questionEl.textContent = appState.i18n[appState.currentLanguage].loadingText;
            const scenario = `Use ${grams} ${units.g} and ask to convert to ${units.khit}.`;
            try {
                questionEl.textContent = await fetchAiProblem(buildWeightAiPrompt(scenario, appState.currentLanguage), appState.geminiProxyUrl, abortSignal);
            } catch (error) {
                if(error.message !== 'Request timeout or cancelled') {
                    questionEl.textContent = questionText;
                }
            }
        }
    }
    
    appState.currentAnswer = correctAnswer;
}

async function handleWeightComparisonWord(appState, units) {
    const itemA = appState.currentLanguage === 'th' ? 'A' : 'A';
    const itemB = appState.currentLanguage === 'th' ? 'B' : 'B';
    const unitKey = Math.random() > 0.5 ? 'g' : 'khit';
    const w1 = Math.floor(Math.random() * 9) + 2;
    const w2 = Math.floor(Math.random() * 9) + 2;
    const weight1 = unitKey === 'g' ? w1 * 100 : w1;
    const weight2 = unitKey === 'g' ? w2 * 100 : w2;
    const unitLabel = units[unitKey];
    const w1InGrams = unitKey === 'g' ? weight1 : weight1 * 100;
    const w2InGrams = unitKey === 'g' ? weight2 : weight2 * 100;
    const sameLabel = appState.currentLanguage === 'th'
        ? `${appState.i18n.th.compareSame} / ${appState.i18n.en.compareSame}`
        : `${appState.i18n.en.compareSame} / ${appState.i18n.th.compareSame}`;

    const questionEl = document.getElementById('weight-question');
    const abortSignal = appState.abortController ? appState.abortController.signal : null;
    let questionText = appState.currentLanguage === 'th'
        ? `${itemA} หนัก ${weight1} ${unitLabel} และ ${itemB} หนัก ${weight2} ${unitLabel} ${appState.i18n.th.compareQuestion}`
        : `${itemA} weighs ${weight1} ${unitLabel} and ${itemB} weighs ${weight2} ${unitLabel}. ${appState.i18n.en.compareQuestion}`;

    if(appState.aiEnabled) {
        questionEl.textContent = appState.i18n[appState.currentLanguage].loadingText;
        const scenario = `Use ${itemA} = ${weight1} ${unitLabel} and ${itemB} = ${weight2} ${unitLabel}. Ask which is heavier. Include (A) and (B) in the question.`;
        try {
            questionEl.textContent = await fetchAiProblem(buildWeightAiPrompt(scenario, appState.currentLanguage), appState.geminiProxyUrl, abortSignal);
        } catch (error) {
            if(error.message !== 'Request timeout or cancelled') {
                questionEl.textContent = questionText;
            }
        }
    }

    if(w1InGrams > w2InGrams) {
        appState.currentAnswer = itemA;
    } else if(w2InGrams > w1InGrams) {
        appState.currentAnswer = itemB;
    } else {
        appState.currentAnswer = sameLabel;
    }

    appState.currentQuestion = {
        type: 'compare',
        options: [itemA, itemB, sameLabel]
    };
}

async function handleComplexWeightComparison(appState, units) {
    const questionEl = document.getElementById('weight-question');
    const abortSignal = appState.abortController ? appState.abortController.signal : null;
    const complexType = Math.floor(Math.random() * 3);
    let weight1Display, weight1GramEquiv, weight2Display, weight2GramEquiv;

    if(complexType === 0) {
        const kg = Math.floor(Math.random() * 3) + 1;
        const extraG = Math.floor(Math.random() * 9) * 100 + 100;
        const totalG = kg * 1000 + extraG;
        const otherG = totalG + (Math.floor(Math.random() * 600) - 300);

        weight1Display = appState.currentLanguage === 'th'
            ? `${kg} ${units.kg} ${extraG} ${units.g}`
            : `${kg} ${units.kg} ${extraG} ${units.g}`;
        weight1GramEquiv = totalG;
        weight2Display = `${otherG} ${units.g}`;
        weight2GramEquiv = otherG;
    } else if(complexType === 1) {
        const kg = Math.floor(Math.random() * 2) + 1;
        const khit = Math.floor(Math.random() * 8) + 2;
        const g = Math.floor(Math.random() * 9) * 100;
        
        weight1Display = `${kg} ${units.kg}`;
        weight1GramEquiv = kg * 1000;
        weight2Display = appState.currentLanguage === 'th'
            ? `${khit} ${units.khit} ${g} ${units.g}`
            : `${khit} ${units.khit} ${g} ${units.g}`;
        weight2GramEquiv = khit * 100 + g;
    } else {
        const kg = Math.floor(Math.random() * 2) + 1;
        const khit = Math.floor(Math.random() * 5);
        const g1 = Math.floor(Math.random() * 9) * 100;
        const total1 = kg * 1000 + khit * 100 + g1;
        const total2 = total1 + (Math.floor(Math.random() * 400) - 200);

        weight1Display = appState.currentLanguage === 'th'
            ? `${kg} ${units.kg} ${khit} ${units.khit} ${g1} ${units.g}`
            : `${kg} ${units.kg} ${khit} ${units.khit} ${g1} ${units.g}`;
        weight1GramEquiv = total1;
        weight2Display = `${total2} ${units.g}`;
        weight2GramEquiv = total2;
    }

    const sameLabel = appState.currentLanguage === 'th'
        ? `${appState.i18n.th.compareSame} / ${appState.i18n.en.compareSame}`
        : `${appState.i18n.en.compareSame} / ${appState.i18n.th.compareSame}`;
    const itemA = 'A';
    const itemB = 'B';

    let questionText = appState.currentLanguage === 'th'
        ? `เปรียบเทียบ: ${itemA} = ${weight1Display} หรือ ${itemB} = ${weight2Display}? ${appState.i18n.th.compareQuestion}`
        : `Compare: ${itemA} = ${weight1Display} or ${itemB} = ${weight2Display}? ${appState.i18n.en.compareQuestion}`;

    if(appState.aiEnabled) {
        questionEl.textContent = appState.i18n[appState.currentLanguage].loadingText;
        const scenario = `Compare two weights: ${itemA} = ${weight1Display} vs ${itemB} = ${weight2Display}. Ask which is heavier. Include (A) and (B) in the question.`;
        try {
            questionEl.textContent = await fetchAiProblem(buildWeightAiPrompt(scenario, appState.currentLanguage), appState.geminiProxyUrl, abortSignal);
        } catch (error) {
            if(error.message !== 'Request timeout or cancelled') {
                questionEl.textContent = questionText;
            }
        }
    }

    if(weight1GramEquiv > weight2GramEquiv) {
        appState.currentAnswer = itemA;
    } else if(weight2GramEquiv > weight1GramEquiv) {
        appState.currentAnswer = itemB;
    } else {
        appState.currentAnswer = sameLabel;
    }

    appState.currentQuestion = {
        type: 'compare',
        options: [itemA, itemB, sameLabel]
    };
}

function generateWeightAnswers(appState, correctAnswer, questionType) {
    let answers;
    let unitLabel = '';
    const units = appState.weightUnits[appState.currentLanguage];
    const isCompare = appState.currentQuestion && appState.currentQuestion.type === 'compare';

    if(!isCompare && (!Number.isFinite(Number(correctAnswer)) || Number(correctAnswer) <= 0)) {
        correctAnswer = 1;
    }

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
    
    if(isCompare) {
        answers = appState.currentQuestion.options;
    } else {
        answers = [correctAnswer];
        
        let attempts = 0;
        while(answers.length < 4 && attempts < 50) {
            attempts++;
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

        while(answers.length < 4) {
            const fallback = Number(correctAnswer) + answers.length;
            if(!answers.includes(fallback)) {
                answers.push(fallback);
            }
        }
        
        shuffleArray(answers);
    }
    
    const answersContainer = document.getElementById('weight-answers');
    answersContainer.innerHTML = '';
    
    answers.forEach(answer => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.dataset.value = answer;
        btn.textContent = isCompare ? answer : `${answer} ${unitLabel}`;
        btn.onclick = () => checkWeightAnswer(appState, answer);
        answersContainer.appendChild(btn);
    });
}

function checkWeightAnswer(appState, selectedAnswer) {
    // Prevent multiple simultaneous checks
    if(appState.isAnswering) {
        return;
    }
    appState.isAnswering = true;
    
    const buttons = document.querySelectorAll('#weight-answers .answer-btn');
    const feedback = document.getElementById('weight-feedback');

    const isCompare = appState.currentQuestion && appState.currentQuestion.type === 'compare';
    
    buttons.forEach(btn => btn.disabled = true);
    
    const isCorrect = isCompare
        ? selectedAnswer === appState.currentAnswer
        : Number(selectedAnswer) === Number(appState.currentAnswer);
    
    if(isCorrect) {
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        showFeedbackOverlay('correct', appState);
        appState.audioContext = playFeedbackSound('correct', appState.audioContext);
        appState.updateScore('weight', 10);
        
        buttons.forEach(btn => {
            const value = isCompare ? btn.dataset.value : Number(btn.dataset.value);
            if(value === appState.currentAnswer || value === Number(appState.currentAnswer)) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            appState.isAnswering = false;
            generateWeightQuestion(appState);
        }, 1500);
    } else {
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        showFeedbackOverlay('wrong', appState);
        appState.audioContext = playFeedbackSound('wrong', appState.audioContext);
        
        buttons.forEach(btn => {
            const value = isCompare ? btn.dataset.value : Number(btn.dataset.value);
            const normalizedSelected = isCompare ? selectedAnswer : Number(selectedAnswer);
            if(value === normalizedSelected) {
                btn.classList.add('wrong');
                btn.disabled = true;
            } else {
                btn.disabled = false;
            }
        });
        
        appState.isAnswering = false;
    }
}
