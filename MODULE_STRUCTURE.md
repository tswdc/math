# Math Learning Games - Module Structure

## Project Overview
An interactive Thai/English math learning game for grades 1-3 with three game modules: Basic Math, Weight Conversion, and Time/Clock Reading. Includes AI-generated word problems via Google Gemini API and cart feedback with sound.

## File Structure

```
├── app.js                    # Main app (216 lines) - Game routing, state management, i18n
├── index.html               # UI structure with all game screens
├── styles.css               # Styling, animations, responsive design
├── server.js                # Node.js proxy for Gemini API
├── package.json             # Dependencies (dotenv)
├── .env.example              # Template for GEMINI_API_KEY
├── .gitignore               # Git ignore rules
└── modules/
    ├── utils.js             # Shared utilities (shuffleArray, feedback, AI fetching)
    ├── math.js              # Math game module (4 operations + word problems)
    ├── weight.js            # Weight conversion module (kg/g/khit with multi-unit comparisons)
    └── time.js              # Time/clock game module (time reading + comparisons)
└── assets/
    ├── correct.svg          # Cartoon face for correct answers
    └── wrong.svg            # Cartoon face for wrong answers
```

## Module Breakdown

### app.js (Main Application)
**Lines: 216 | Responsibilities:**
- Global state management (appState object)
- i18n translations (Thai/English)
- Weight unit definitions
- Language/AI toggle setup
- Game routing (startGame, backToMenu)
- Clock tick rendering

**Key Functions:**
- `setLanguage(lang)` - Update all UI text
- `startGame(gameType)` - Switch between game modules
- `renderClockTicks()` - Draw clock marks

### modules/utils.js (Shared Utilities)
**Lines: ~100 | Responsibilities:**
- Shuffle array (randomize answers)
- Feedback overlay display (cartoon animations)
- Web Audio synthesis for sound effects
- Gemini API proxy calls
- AI prompt builders for each module

**Key Exports:**
```javascript
- shuffleArray(array)
- showFeedbackOverlay(type) → displays cartoon feedback
- playFeedbackSound(type, audioContext) → returns audioContext
- fetchAiProblem(prompt, geminiProxyUrl)
- buildMathAiPrompt(operation, num1, num2, currentLanguage)
- buildWeightAiPrompt(scenario, currentLanguage)
- buildTimeAiPrompt(currentLanguage)
```

### modules/math.js (Basic Math Game)
**Lines: ~200 | Question Types:**
1. Standard problems: `5 + 3 = ?`
2. Word problems (Thai/English) - 40% chance of AI-generated

**Operations:** Addition, Subtraction, Multiplication, Division

**Key Functions:**
- `startMathGame(appState)` - Initialize module
- `generateMathQuestion(appState)` - Create new question
- `generateMathAnswers(appState, correctAnswer)` - Generate 4 answer choices

### modules/weight.js (Weight Conversion Game)
**Lines: ~500 | Question Types:**
1. kg → g conversion
2. g → kg conversion
3. khit → g conversion (1 khit = 100g)
4. g → khit conversion
5. Simple comparisons (heavier/lighter/equal)
6. Word problems
7. Comparison word problems (Box A vs B)
8. Complex multi-unit comparisons (e.g., "1 kg 120g vs 1200g")

**AI Integration:** All word problems can be AI-generated with fallback templates

**Key Functions:**
- `startWeightGame(appState)`
- `generateWeightQuestion(appState)` - Randomly picks 8 question types
- `handleComplexWeightComparison(appState, units)` - Multi-unit logic

### modules/time.js (Time & Clock Game)
**Lines: ~200 | Question Types:**
1. Clock reading - "What time is shown?"
2. Time comparison - "Which time is earlier/later?" (30% chance)

**Features:**
- Interactive analog clock with moving hands
- 12-hour time format (on-the-hour or half-hour)
- Dual-language prompts

**Key Functions:**
- `startTimeGame(appState)`
- `generateTimeQuestion(appState)`
- `setClockTime(hours, minutes)` - Position clock hands
- `formatTime(hours, minutes)` - Convert to display format

## Data Flow

```
index.html (type="module")
    ↓
app.js imports
    ├── math.js
    ├── weight.js
    ├── time.js
    └── utils.js
    ↓
User clicks "Start Game"
    ↓
startGame(gameType) routes to module
    ↓
Module's startXxxGame(appState):
    • Initializes game state
    • Calls generateXxxQuestion(appState)
    ↓
generateXxxQuestion(appState):
    • Creates question logic
    • If aiEnabled: calls fetchAiProblem()
    • Generates answer choices
    • Updates DOM
    ↓
User selects answer
    ↓
checkXxxAnswer():
    • Validates answer
    • Shows feedback (showFeedbackOverlay + playFeedbackSound)
    • Updates score via appState.updateScore()
    • Calls next question or returns to menu
```

## Global State (appState)
```javascript
{
    currentGame: 'math' | 'weight' | 'time' | null,
    scores: { math: 0, weight: 0, time: 0 },
    currentLanguage: 'th' | 'en',
    aiEnabled: true | false,
    geminiProxyUrl: '/api/gemini',
    currentQuestion: { type, options },
    currentAnswer: any,
    audioContext: AudioContext,
    overlayTimeoutId: number,
    i18n: {...},  // Translations
    weightUnits: {...},  // Unit labels
    updateScore(gameType, points) // Increment score
}
```

## Backend Integration

### Server Setup (server.js)
```bash
npm install dotenv
# Create .env with GEMINI_API_KEY=your_key
npm start  # Runs on port 3000
```

### API Endpoint: POST `/api/gemini`
**Request:**
```json
{
  "model": "gemini-3-flash-preview",
  "prompt": "Create a grade 1-3 word problem..."
}
```

**Response:**
```json
{ "text": "Generated problem text" }
```

## Benefits of Modularization

✅ **Maintainability** - Each module <600 lines, focused responsibility
✅ **Reusability** - Shared utils imported by all modules
✅ **Scalability** - Add new game modules without touching app.js
✅ **Testing** - Individual modules can be tested in isolation
✅ **Code Organization** - Clear separation of concerns
✅ **Debugging** - Find issues faster in focused files
✅ **Performance** - ES6 modules enable tree-shaking and code splitting

## Size Comparison

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| app.js | 1082 | 216 | -80% |
| + modules | - | 900 | Total size: 1116 (distributed) |

**Result:** Main app file reduced from 1082 to 216 lines while total code is organized into 5 modular files
