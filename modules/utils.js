// Shared utility functions

export function shuffleArray(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function showFeedbackOverlay(type, appState) {
    const overlay = document.getElementById('feedback-overlay');
    const image = document.getElementById('feedback-image');

    if(!overlay || !image) {
        return;
    }

    // Clear previous timeout
    if(appState && appState.overlayTimeoutId) {
        clearTimeout(appState.overlayTimeoutId);
    }

    image.src = type === 'correct' ? 'assets/correct.svg' : 'assets/wrong.svg';
    overlay.classList.remove('correct', 'wrong', 'show');
    overlay.classList.add(type);

    requestAnimationFrame(() => {
        overlay.classList.add('show');
    });

    const overlayTimeoutId = setTimeout(() => {
        overlay.classList.remove('show');
    }, 700);
    
    if(appState) {
        appState.overlayTimeoutId = overlayTimeoutId;
    }
}

export function playFeedbackSound(type, audioContext) {
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

    return audioContext;
}

export async function fetchAiProblem(prompt, geminiProxyUrl, abortSignal) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
        const response = await fetch(geminiProxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gemini-flash-latest',
                prompt
            }),
            signal: abortSignal || controller.signal
        });

        clearTimeout(timeoutId);

        if(!response.ok) {
            throw new Error('AI request failed');
        }

        const data = await response.json();
        const text = (data && data.text) ? data.text.trim() : '';
        if(!text) {
            throw new Error('AI response empty');
        }

        return text;
    } catch(error) {
        clearTimeout(timeoutId);
        if(error.name === 'AbortError') {
            throw new Error('Request timeout or cancelled');
        }
        throw error;
    }
}

export function buildMathAiPrompt(operation, num1, num2, currentLanguage) {
    const langLabel = currentLanguage === 'th' ? 'Thai' : 'English';
    const opLabel = operation === '+' ? 'addition' : operation === '-' ? 'subtraction' : operation === '*' ? 'multiplication' : 'division';
    return `Create a grade 1-3 word problem in ${langLabel}. Real world scenarios question, modified as need. Use exactly the numbers ${num1} and ${num2} with ${opLabel}. One short sentence. No answer.`;
}

export function buildWeightAiPrompt(scenario, currentLanguage) {
    const langLabel = currentLanguage === 'th' ? 'Thai' : 'English';
    return `Create a grade 1-3 word problem in ${langLabel}. Real world scenarios question, modified as need. ${scenario} One or two short sentence. No answer. No unit conversion hint.`;
}

export function buildTimeAiPrompt(currentLanguage, timeString, fallbackScenario) {
    const langLabel = currentLanguage === 'th' ? 'Thai' : 'English';
    return `Create a grade 1-3 short prompt in ${langLabel} asking the student to read the clock. Use a realistic daily-life scenario. The intended clock time is ${timeString} for internal reference only. Do not include any explicit clock time, numbers, or hour/minute values in the prompt text. Similar context: "${fallbackScenario}". Keep it one or two short sentences, no answer, no hints.`;
}
