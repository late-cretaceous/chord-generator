import { MODES } from './modes';
import { NOTES, MODE_PATTERNS } from './core';
// Use the fixed inversions implementation
import { applyProgressionInversions } from './inversions';

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
 * @param {Object} mode - Mode definition containing chord qualities
 * @returns {string} Next chord in roman numeral notation
 */
export function selectNextChord(currentChord, transitions, mode) {
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
        const nextChord = selectNextChord(currentChord, mode.transitions, mode);
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
 * @param {string|Object} mode - The mode object or name
 * @returns {string} The modal root note
 */
function calculateModalRoot(key, mode) {
    // Extract the mode name regardless of whether it's passed as a string or object
    let modeName;
    if (typeof mode === 'string') {
        modeName = mode;
    } else if (mode && mode.name) {
        modeName = mode.name;
    } else {
        // Default to ionian if no mode name is found
        modeName = 'ionian';
    }

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
    for (let i = 0; i < progression.length; i++) {
        const numeral = progression[i];
        const degree = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']
            .indexOf(numeral.toLowerCase());
        
        const quality = mode.chordQualities[numeral];
        if (degree !== -1 && quality) {
            romanNumeralMap[numeral] = { degree, quality };
        } else {
            console.error(`Could not map roman numeral: ${numeral}`);
        }
    }

    return progression.map(numeral => {
        if (!romanNumeralMap[numeral]) {
            // If we can't map this numeral, return something reasonable
            return 'C';
        }
        
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
 * @param {string|Object} modeName - Mode name or definition to use
 * @param {boolean} useInversions - Whether to apply intelligent inversions
 * @returns {string[]} Array of chord symbols
 */
export function generateProgression(length = 4, key = 'C', modeName = 'ionian', useInversions = true) {
    // Determine which mode to use
    let mode;
    if (typeof modeName === 'string') {
        mode = MODES[modeName] || MODES.ionian;
    } else {
        mode = modeName; // Assume we were passed a mode object directly
    }

    if (!mode) {
        console.error('Invalid mode, falling back to ionian');
        mode = MODES.ionian;
    }

    // Calculate the actual root note for the mode
    const modalRoot = calculateModalRoot(key, mode);
    
    // Generate roman numeral progression
    const romanNumerals = generateChordProgression(length, mode);
    
    // Convert to chord symbols
    const progression = romanToChordSymbols(romanNumerals, modalRoot, mode);
    
    // Apply inversions for better voice leading if option is enabled
    if (useInversions) {
        return applyProgressionInversions(progression);
    }
    
    return progression;
}