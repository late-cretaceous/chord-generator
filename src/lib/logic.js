import { MODES } from './modes';
import { NOTES, MODE_PATTERNS } from './core';

/**
 * Determines the correct case for the tonic chord based on its quality
 * @param {Object} mode - Mode definition containing chord qualities
 * @returns {string} 'I' for major/augmented, 'i' for minor/diminished
 */
function getTonicChord(mode) {
    if (!mode || !mode.chordQualities) {
        return 'I'; // Default to major if mode is invalid
    }
    const tonicQuality = mode.chordQualities.I || mode.chordQualities.i;
    return (tonicQuality === 'major' || tonicQuality === 'augmented') ? 'I' : 'i';
}

/**
 * Selects the next chord based on transition probabilities
 * @param {string} currentChord - Current chord in roman numeral notation
 * @param {Object} transitions - Transition probability matrix
 * @returns {string} Next chord in roman numeral notation
 */
export function selectNextChord(currentChord, transitions) {
    if (!transitions || !currentChord) {
        console.error('Invalid transitions or currentChord:', { transitions, currentChord });
        return 'I'; // Default to tonic if there's an error
    }

    const probabilities = transitions[currentChord];
    if (!probabilities) {
        console.error('No transitions found for chord:', currentChord);
        return getTonicChord(mode); // Return appropriate tonic if no transitions found
    }

    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const [chord, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) {
            return chord;
        }
    }
    
    return Object.keys(probabilities)[0];
}

/**
 * Generates a chord progression of specified length
 * @param {number} length - Desired length of progression
 * @param {Object} mode - Mode definition containing transition matrix
 * @returns {string[]} Array of chord symbols in roman numeral notation
 */
export function generateChordProgression(length = 4, mode = MODES.ionian) {
    if (!mode || !mode.transitions) {
        console.error('Invalid mode:', mode);
        mode = MODES.ionian; // Fallback to ionian if mode is invalid
    }

    const tonic = getTonicChord(mode);
    const progression = [tonic]; // Start with appropriate tonic
    
    for (let i = 1; i < length; i++) {
        const currentChord = progression[progression.length - 1];
        const nextChord = selectNextChord(currentChord, mode.transitions);
        progression.push(nextChord);
    }
    
    return progression;
}

/**
 * Gets the root note for a given scale degree in a key
 * @param {string} key - The key (e.g., 'C')
 * @param {number} scaleDegree - The scale degree (0-6)
 * @param {Object} mode - Mode definition containing intervals
 * @returns {string} The root note for that scale degree
 */
function getScaleDegreeRoot(key, scaleDegree, mode) {
    if (!mode || !mode.intervals) {
        console.error('Invalid mode or intervals:', mode);
        mode = MODES.ionian; // Fallback to ionian if mode is invalid
    }

    const keyIndex = NOTES.indexOf(key);
    if (keyIndex === -1) throw new Error(`Invalid key: ${key}`);
    
    const noteIndex = (keyIndex + mode.intervals[scaleDegree]) % 12;
    return NOTES[noteIndex];
}

/**
 * Get the correct modal root based on key and mode
 * @param {string} key - The tonic key (e.g., 'C')
 * @param {string} modeName - The mode name (e.g., 'dorian')
 * @returns {string} The modal root note
 */
function calculateModalRoot(key, modeName) {
    const modeSteps = {
        'ionian': 0,     // Same as key
        'dorian': 1,     // Second scale degree
        'phrygian': 2,   // Third scale degree
        'lydian': 3,     // Fourth scale degree
        'mixolydian': 4, // Fifth scale degree
        'aeolian': 5,    // Sixth scale degree
        'locrian': 6     // Seventh scale degree
    };

    const step = modeSteps[modeName.toLowerCase()];
    if (step === undefined) return key;

    const keyIndex = NOTES.indexOf(key);
    if (keyIndex === -1) return key;

    // Get major scale intervals to find correct modal root
    const majorScaleIntervals = MODE_PATTERNS.ionian.intervals;
    const targetInterval = majorScaleIntervals[step];
    const modalRootIndex = (keyIndex + targetInterval) % 12;
    
    return NOTES[modalRootIndex];
}

/**
 * Converts roman numeral progression to actual chord symbols
 * @param {string[]} progression - Array of roman numerals
 * @param {string} key - Key to generate progression in (e.g., 'C')
 * @param {Object} mode - Mode definition containing chord qualities
 * @returns {string[]} Array of chord symbols (e.g., ['Cm', 'Dm', 'E♭', 'F'])
 */
export function romanToChordSymbols(progression, key = 'C', mode = MODES.ionian) {
    if (!mode || !mode.chordQualities) {
        console.error('Invalid mode or chord qualities:', mode);
        mode = MODES.ionian; // Fallback to ionian if mode is invalid
    }

    // Create case-insensitive map of roman numerals to degrees and qualities
    const romanNumeralMap = {};
    progression.forEach(numeral => {
        const degree = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']
            .indexOf(numeral.toLowerCase());
        
        const quality = mode.chordQualities[numeral];
        if (degree !== -1 && quality) {
            romanNumeralMap[numeral] = { degree, quality };
        }
    });

    return progression.map(numeral => {
        const { degree, quality } = romanNumeralMap[numeral];
        const root = getScaleDegreeRoot(key, degree, mode);
        const suffix = quality === 'major' ? '' : 
                      quality === 'minor' ? 'm' : 
                      quality === 'diminished' ? 'dim' : quality;
        return root + suffix;
    });
}

/**
 * Main composition function that generates a complete chord progression
 * @param {number} length - Desired length of progression
 * @param {string} key - Key to generate progression in
 * @param {Object} mode - Mode definition to use
 * @returns {string[]} Array of chord symbols
 */
export function generateProgression(length = 4, key = 'C', mode = MODES.ionian) {
    if (!mode) {
        console.error('Invalid mode, falling back to ionian:', mode);
        mode = MODES.ionian;
    }

    // Calculate the actual root note for the mode
    const modalRoot = calculateModalRoot(key, mode.name || 'ionian');
    
    const romanNumerals = generateChordProgression(length, mode);
    return romanToChordSymbols(romanNumerals, modalRoot, mode);
}