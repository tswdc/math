// Global variables
let currentGame = null;
let scores = {
    math: 0,
    weight: 0,
    time: 0
};

// Game state
let currentQuestion = null;
let currentAnswer = null;

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

// ==================== Basic Math Game ====================

const mathOperations = ['+', '-', '*', '/'];

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
    
    // Display question
    document.getElementById('math-question').textContent = `${num1} ${operation} ${num2} = ?`;
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
    
    // Thai weight unit: 1 ขีด (khit) = 15 grams
    // Question types:
    // 1. kg to g
    // 2. g to kg
    // 3. ขีด to g
    // 4. g to ขีด
    // 5. Compare weights
    
    const questionType = Math.floor(Math.random() * 5);
    let questionText, correctAnswer;
    
    switch(questionType) {
        case 0: // kg to g
            const kg = Math.floor(Math.random() * 5) + 1;
            questionText = `${kg} kg = ? g`;
            correctAnswer = kg * 1000;
            break;
        case 1: // g to kg
            const g = (Math.floor(Math.random() * 5) + 1) * 1000;
            questionText = `${g} g = ? kg`;
            correctAnswer = g / 1000;
            break;
        case 2: // ขีด to g
            const khit = Math.floor(Math.random() * 10) + 1;
            questionText = `${khit} ขีด = ? g`;
            correctAnswer = khit * 15;
            break;
        case 3: // g to ขีด
            const grams = (Math.floor(Math.random() * 10) + 1) * 15;
            questionText = `${grams} g = ? ขีด`;
            correctAnswer = grams / 15;
            break;
        case 4: // Compare weights
            const weight1 = Math.floor(Math.random() * 500) + 100;
            const weight2 = Math.floor(Math.random() * 500) + 100;
            const unit1 = Math.random() > 0.5 ? 'g' : 'ขีด';
            const unit2 = Math.random() > 0.5 ? 'g' : 'ขีด';
            
            const w1InGrams = unit1 === 'g' ? weight1 : weight1 * 15;
            const w2InGrams = unit2 === 'g' ? weight2 : weight2 * 15;
            
            if(w1InGrams > w2InGrams) {
                questionText = `Which is heavier? / อันไหนหนักกว่า?`;
                correctAnswer = `${weight1} ${unit1}`;
            } else if(w2InGrams > w1InGrams) {
                questionText = `Which is heavier? / อันไหนหนักกว่า?`;
                correctAnswer = `${weight2} ${unit2}`;
            } else {
                questionText = `Which is heavier? / อันไหนหนักกว่า?`;
                correctAnswer = 'Same / เท่ากัน';
            }
            
            // Store comparison options
            currentQuestion = {
                type: 'compare',
                options: [`${weight1} ${unit1}`, `${weight2} ${unit2}`, 'Same / เท่ากัน']
            };
            break;
    }
    
    document.getElementById('weight-question').textContent = questionText;
    currentAnswer = correctAnswer;
    
    generateWeightAnswers(correctAnswer, questionType);
}

function generateWeightAnswers(correctAnswer, questionType) {
    let answers;
    
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
        btn.textContent = answer;
        btn.onclick = () => checkWeightAnswer(answer);
        answersContainer.appendChild(btn);
    });
}

function checkWeightAnswer(selectedAnswer) {
    const buttons = document.querySelectorAll('#weight-answers .answer-btn');
    const feedback = document.getElementById('weight-feedback');
    
    buttons.forEach(btn => btn.disabled = true);
    
    const isCorrect = selectedAnswer == currentAnswer || selectedAnswer === currentAnswer;
    
    if(isCorrect) {
        feedback.textContent = '🎉 Correct! เยี่ยมมาก!';
        feedback.className = 'feedback correct';
        updateScore('weight', 10);
        
        buttons.forEach(btn => {
            if(btn.textContent == currentAnswer || btn.textContent === currentAnswer) {
                btn.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            generateWeightQuestion();
        }, 1500);
    } else {
        feedback.textContent = '❌ Try again! ลองใหม่อีกครั้ง!';
        feedback.className = 'feedback wrong';
        
        buttons.forEach(btn => {
            if(btn.textContent === selectedAnswer.toString() || btn.textContent === selectedAnswer) {
                btn.classList.add('wrong');
            } else if(btn.textContent == currentAnswer || btn.textContent === currentAnswer) {
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
    document.getElementById('time-question').textContent = 'What time is it? / กี่โมงแล้ว?';
    
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
