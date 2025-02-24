// lib/progression-generator.js
import { MODES } from './modes';

/**
 * Gets the tonic chord Roman numeral based on the mode
 * @param {Object} mode - The mode definition
 * @returns {string} Roman numeral for the tonic chord
 */
export function getTonicChord(mode) {
    if (!mode || !mode.chordQualities) return 'I';
    const tonicQuality = mode.chordQualities.I || mode.chordQualities.i;
    return (tonicQuality === 'major' || tonicQuality === 'augmented') ? 'I' : 'i';
}

/**
 * Selects the next chord based on transition probabilities
 * @param {string} currentChord - Current chord Roman numeral
 * @param {Object} transitions - Transition probability map
 * @param {Object} mode - The mode being used
 * @returns {string} Next chord Roman numeral
 */
export function selectNextChord(currentChord, transitions, mode) {
    // If no transitions defined or no current chord, return tonic
    if (!transitions || !currentChord) return getTonicChord(mode);
    
    // Get probability distribution for current chord
    const probabilities = transitions[currentChord];
    
    // If no probabilities found for this chord, use default progression
    if (!probabilities || Object.keys(probabilities).length === 0) {
        console.warn(`No transition probabilities found for ${currentChord} in ${mode.name} mode`);
        
        // Use default progression patterns based on mode type
        if (mode.name === 'ionian' || mode.name === 'lydian' || mode.name === 'mixolydian') {
            // Major mode defaults
            const majorDefaults = {
                'I': ['IV', 'V', 'vi', 'ii'],
                'ii': ['V', 'vii', 'iii'],
                'iii': ['vi', 'IV', 'ii'],
                'IV': ['V', 'I', 'ii'],
                'V': ['I', 'vi', 'IV'],
                'vi': ['ii', 'IV', 'V'],
                'vii': ['I', 'iii']
            };
            
            const options = majorDefaults[currentChord] || ['I', 'IV', 'V'];
            return options[Math.floor(Math.random() * options.length)];
        } else {
            // Minor mode defaults
            const minorDefaults = {
                'i': ['iv', 'v', 'VI', 'VII'],
                'ii': ['v', 'i', 'VII'],
                'III': ['VI', 'iv', 'VII'],
                'iv': ['v', 'i', 'VII'],
                'v': ['i', 'VI', 'III'],
                'VI': ['III', 'iv', 'ii'],
                'VII': ['III', 'i', 'v']
            };
            
            const options = minorDefaults[currentChord] || ['i', 'iv', 'v'];
            return options[Math.floor(Math.random() * options.length)];
        }
    }
    
    // Normal weighted selection based on probabilities
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const [chord, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) return chord;
    }
    
    // Fallback in case of rounding errors
    return Object.keys(probabilities)[0];
}

/**
 * Generates a sequence of Roman numeral chord symbols based on mode transition probabilities
 * @param {number} length - Desired progression length
 * @param {Object} mode - The mode to use for generation
 * @returns {Array} Progression as array of Roman numerals
 */
export function generateChordProgression(length = 4, mode = MODES.ionian) {
    // Fallback to ionian if no mode or transitions provided
    if (!mode) mode = MODES.ionian;
    
    // Create a shallow copy of the mode to avoid modifying the original
    const workingMode = { ...mode };
    
    // Ensure transitions exist
    if (!workingMode.transitions || Object.keys(workingMode.transitions).length === 0) {
        console.warn(`No transitions defined for ${workingMode.name} mode, using defaults`);
        
        // Create default transitions based on mode type
        if (workingMode.name === 'ionian' || workingMode.name === 'lydian' || workingMode.name === 'mixolydian') {
            workingMode.transitions = {
                'I': { 'ii': 0.2, 'IV': 0.3, 'V': 0.3, 'vi': 0.2 },
                'ii': { 'V': 0.6, 'IV': 0.2, 'vii': 0.2 },
                'iii': { 'vi': 0.4, 'IV': 0.3, 'ii': 0.3 },
                'IV': { 'V': 0.4, 'I': 0.3, 'ii': 0.3 },
                'V': { 'I': 0.6, 'vi': 0.3, 'iii': 0.1 },
                'vi': { 'ii': 0.3, 'IV': 0.4, 'V': 0.3 },
                'vii': { 'I': 0.7, 'iii': 0.3 }
            };
        } else {
            workingMode.transitions = {
                'i': { 'iv': 0.3, 'v': 0.3, 'VI': 0.2, 'VII': 0.2 },
                'ii': { 'v': 0.6, 'i': 0.2, 'VII': 0.2 },
                'III': { 'VI': 0.4, 'iv': 0.3, 'VII': 0.3 },
                'iv': { 'v': 0.4, 'i': 0.3, 'VII': 0.3 },
                'v': { 'i': 0.6, 'VI': 0.3, 'III': 0.1 },
                'VI': { 'III': 0.3, 'iv': 0.4, 'ii': 0.3 },
                'VII': { 'III': 0.4, 'i': 0.6 }
            };
        }
    }
    
    // Get the starting chord (tonic)
    const tonic = getTonicChord(workingMode);
    const progression = [tonic];
    
    // Generate the rest of the progression
    for (let i = 1; i < length; i++) {
        const currentChord = progression[progression.length - 1];
        const nextChord = selectNextChord(currentChord, workingMode.transitions, workingMode);
        progression.push(nextChord);
    }
    
    return progression;
}