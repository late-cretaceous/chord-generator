// lib/progression-generator.js
import { MODES } from './modes';
import { romanToChordSymbols, getNotesFromChordSymbol, parseChordSymbol } from './core';
import { applyChordExtensions } from './chord-extensions';
import { applyCadentialPattern, suggestCadentialPattern } from './voice/cadential-patterns';

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
 * Selects the next chord based on transition probabilities with added variety
 * @param {string} currentChord - Current chord Roman numeral
 * @param {Object} transitions - Transition probability map
 * @param {Object} mode - The mode being used
 * @param {boolean} allowSurprises - Whether to occasionally allow unexpected transitions
 * @returns {string} Next chord Roman numeral
 */
export function selectNextChord(currentChord, transitions, mode, allowSurprises = true) {
    // If no transitions defined or no current chord, return tonic
    if (!transitions || !currentChord) return getTonicChord(mode);
    
    // Get probability distribution for current chord
    const probabilities = transitions[currentChord];
    
    // Occasionally allow "surprising" choices (5% chance if enabled)
    if (allowSurprises && Math.random() < 0.05) {
        // Get all possible chords in this mode
        const allChords = Object.keys(transitions);
        if (allChords.length > 0) {
            // Pick a random chord, avoiding the current one
            const filteredChords = allChords.filter(chord => chord !== currentChord);
            if (filteredChords.length > 0) {
                return filteredChords[Math.floor(Math.random() * filteredChords.length)];
            }
        }
    }
    
    // If no probabilities found for this chord, use default progression
    if (!probabilities || Object.keys(probabilities).length === 0) {
        console.warn(`No transition probabilities found for ${currentChord} in ${mode.name} mode`);
        
        // Use default progression patterns based on mode type
        if (mode.name === 'ionian' || mode.name === 'lydian' || mode.name === 'mixolydian') {
            // Major mode defaults
            const majorDefaults = {
                'I': ['IV', 'V', 'vi', 'ii'],
                'ii': ['V', 'vii', 'iii', 'IV'],
                'iii': ['vi', 'IV', 'ii', 'I'],
                'IV': ['V', 'I', 'ii', 'vi'],
                'V': ['I', 'vi', 'IV', 'iii'],
                'vi': ['ii', 'IV', 'V', 'I'],
                'vii': ['I', 'iii', 'V']
            };
            
            const options = majorDefaults[currentChord] || ['I', 'IV', 'V'];
            return options[Math.floor(Math.random() * options.length)];
        } else {
            // Minor mode defaults
            const minorDefaults = {
                'i': ['iv', 'v', 'VI', 'VII', 'III'],
                'ii': ['v', 'i', 'VII', 'iv'],
                'III': ['VI', 'iv', 'VII', 'i'],
                'iv': ['v', 'i', 'VII', 'III'],
                'v': ['i', 'VI', 'III', 'iv'],
                'VI': ['III', 'iv', 'ii', 'VII'],
                'VII': ['III', 'i', 'v', 'VI']
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
 * Generates a chord progression with priority for authentic cadences
 * but with enhanced variety
 * @param {number} length - Desired progression length 
 * @param {Object} mode - The mode to use for generation
 * @returns {Array} Progression as array of Roman numerals
 */
export function generateChordProgressionWithCadence(length = 4, mode = MODES.ionian) {
    // Fallback to ionian if no mode provided
    if (!mode) mode = MODES.ionian;
    
    // Create a shallow copy of the mode to avoid modifying the original
    const workingMode = { ...mode };
    
    // Ensure transitions exist
    if (!workingMode.transitions || Object.keys(workingMode.transitions).length === 0) {
        console.warn(`No transitions defined for ${workingMode.name} mode, using defaults`);
        
        // Create default transitions based on mode type
        if (workingMode.name === 'ionian' || workingMode.name === 'lydian' || workingMode.name === 'mixolydian') {
            workingMode.transitions = {
                'I': { 'ii': 0.2, 'IV': 0.3, 'V': 0.3, 'vi': 0.15, 'iii': 0.05 },
                'ii': { 'V': 0.5, 'IV': 0.2, 'vii': 0.15, 'I': 0.1, 'vi': 0.05 },
                'iii': { 'vi': 0.3, 'IV': 0.25, 'ii': 0.25, 'I': 0.15, 'V': 0.05 },
                'IV': { 'V': 0.35, 'I': 0.25, 'ii': 0.25, 'vi': 0.1, 'iii': 0.05 },
                'V': { 'I': 0.5, 'vi': 0.25, 'iii': 0.1, 'IV': 0.1, 'ii': 0.05 },
                'vi': { 'ii': 0.3, 'IV': 0.3, 'V': 0.2, 'I': 0.15, 'iii': 0.05 },
                'vii': { 'I': 0.6, 'iii': 0.2, 'vi': 0.15, 'V': 0.05 }
            };
        } else {
            workingMode.transitions = {
                'i': { 'iv': 0.25, 'v': 0.25, 'VI': 0.2, 'VII': 0.2, 'III': 0.1 },
                'ii': { 'v': 0.5, 'i': 0.2, 'VII': 0.15, 'iv': 0.1, 'III': 0.05 },
                'III': { 'VI': 0.3, 'iv': 0.25, 'VII': 0.25, 'i': 0.15, 'ii': 0.05 },
                'iv': { 'v': 0.35, 'i': 0.25, 'VII': 0.2, 'III': 0.15, 'VI': 0.05 },
                'v': { 'i': 0.5, 'VI': 0.2, 'III': 0.15, 'iv': 0.1, 'VII': 0.05 },
                'VI': { 'III': 0.25, 'iv': 0.25, 'ii': 0.2, 'VII': 0.15, 'i': 0.15 },
                'VII': { 'III': 0.35, 'i': 0.4, 'v': 0.15, 'VI': 0.1 }
            };
        }
    }
    
    // For very short progressions (2-3 chords), add some variety
    if (length <= 3) {
        if (workingMode.name === 'ionian' || workingMode.name === 'lydian' || workingMode.name === 'mixolydian') {
            // Add more variety to short major progressions
            const shortOptions = [
                ['V', 'I'],      // Authentic cadence
                ['IV', 'I'],     // Plagal cadence
                ['I', 'V'],      // Half cadence
                ['ii', 'V']      // Partial extended cadence
            ];
            return length === 2 ? 
                   shortOptions[Math.floor(Math.random() * shortOptions.length)] : 
                   ['I', 'V', 'I'];
        } else {
            // Add more variety to short minor progressions
            const shortOptions = [
                ['V', 'i'],      // Authentic cadence
                ['iv', 'i'],     // Plagal cadence
                ['i', 'V'],      // Half cadence
                ['VII', 'i'],    // Natural minor cadence
                ['II', 'i']      // Phrygian-style cadence (for phrygian mode)
            ];
            return length === 2 ? 
                   shortOptions[Math.floor(Math.random() * shortOptions.length)] : 
                   ['i', 'V', 'i'];
        }
    }
    
    // Get the tonic chord
    const tonic = getTonicChord(workingMode);
    
    // Decide if we start on tonic or somewhere else (80% chance of starting on tonic)
    let progression = [];
    if (Math.random() < 0.8) {
        progression = [tonic];
    } else {
        // Pick a non-tonic starting chord
        const nonTonicOptions = Object.keys(workingMode.transitions).filter(chord => chord !== tonic);
        if (nonTonicOptions.length > 0) {
            progression = [nonTonicOptions[Math.floor(Math.random() * nonTonicOptions.length)]];
        } else {
            progression = [tonic];
        }
    }
    
    // Generate the middle part of the progression
    const allowVariety = Math.random() < 0.7; // 70% chance of allowing surprising choices
    
    for (let i = 1; i < length - 1; i++) {
        const currentChord = progression[progression.length - 1];
        const nextChord = selectNextChord(currentChord, workingMode.transitions, workingMode, allowVariety);
        progression.push(nextChord);
    }
    
    // For the final chord, 70% chance to end on tonic
    if (Math.random() < 0.7) {
        // Calculate appropriate pre-cadential chord based on mode
        const lastChord = progression[progression.length - 1];
        
        // Major modes
        if (workingMode.name === 'ionian' || workingMode.name === 'lydian' || workingMode.name === 'mixolydian') {
            // If we're already heading to a good cadence, leave it alone
            if ((lastChord === 'V' || lastChord === 'IV' || lastChord === 'ii') &&
                Math.random() < 0.5) {
                progression.push('I');
            } else {
                // Pick a cadential approach
                const cadentialOptions = [
                    ['V', 'I'],       // Authentic
                    ['IV', 'I'],      // Plagal
                    ['ii', 'I'],      // Deceptive resolution of ii
                    ['vii', 'I']      // Leading tone resolution
                ];
                const selected = cadentialOptions[Math.floor(Math.random() * cadentialOptions.length)];
                
                // Replace last chord and add final chord
                progression[progression.length - 1] = selected[0];
                progression.push(selected[1]);
            }
        } 
        // Minor modes
        else {
            // If we're already heading to a good cadence, leave it alone
            if ((lastChord === 'V' || lastChord === 'iv' || lastChord === 'VII') &&
                Math.random() < 0.5) {
                progression.push('i');
            } else {
                // Pick a cadential approach based on mode
                let cadentialOptions = [
                    ['V', 'i'],       // Authentic
                    ['iv', 'i'],      // Plagal
                    ['VII', 'i']      // Natural minor
                ];
                
                // Add mode-specific options
                if (workingMode.name === 'phrygian') {
                    cadentialOptions.push(['II', 'i']); // Phrygian cadence
                }
                
                if (workingMode.name === 'dorian') {
                    cadentialOptions.push(['IV', 'i']); // Dorian cadence
                }
                
                const selected = cadentialOptions[Math.floor(Math.random() * cadentialOptions.length)];
                
                // Replace last chord and add final chord
                progression[progression.length - 1] = selected[0];
                progression.push(selected[1]);
            }
        }
    } else {
        // For the 30% non-tonic endings, pick something interesting
        const currentChord = progression[progression.length - 1];
        const finalChord = selectNextChord(currentChord, workingMode.transitions, workingMode, false);
        progression.push(finalChord);
    }
    
    // Ensure progression is exactly the requested length
    if (progression.length > length) {
        progression = progression.slice(0, length);
    } else if (progression.length < length) {
        // Start over with a simpler approach if we didn't generate enough chords
        return generateChordProgression(length, mode);
    }
    
    return progression;
}

/**
 * Generates a sequence of Roman numeral chord symbols based on mode transition probabilities
 * @param {number} length - Desired progression length
 * @param {Object} mode - The mode to use for generation
 * @returns {Array} Progression as array of Roman numerals
 */
export function generateChordProgression(length = 4, mode = MODES.ionian) {
    // Use the enhanced cadence-aware generator
    return generateChordProgressionWithCadence(length, mode);
}

/**
 * NEW FUNCTION: Enhances a progression with proper chord extensions and cadential patterns
 * @param {Object} options - Progression options
 * @returns {Array} Chord objects with notes
 */
export function enhanceProgressionWithExtensions(options) {
    const {
        length = 4,
        key = 'C',
        mode = MODES.ionian,
        useExtendedChords = 'none',
        rootOctave = 2,
        cadenceType = null,
        strictCadence = false,
        pattern = null,
        useStructuralPattern = false
    } = options;
    
    // Generate base Roman numeral progression
    let romanNumerals = generateChordProgression(length, mode, {
        pattern, 
        useStructuralPattern
    });
    
    // Apply cadential patterns if needed
    if (strictCadence && cadenceType) {
        // Strict enforcement of specified cadence
        romanNumerals = applyCadentialPattern(romanNumerals, mode.name, cadenceType);
    } else if (cadenceType) {
        // Apply specified cadence with 50% probability
        if (Math.random() < 0.5) {
            romanNumerals = applyCadentialPattern(romanNumerals, mode.name, cadenceType);
        }
    } else if (Math.random() < 0.4) {
        // 40% chance to apply a suggested cadence for more variety
        const suggestedCadence = suggestCadentialPattern(romanNumerals, mode.name);
        romanNumerals = applyCadentialPattern(romanNumerals, mode.name, suggestedCadence);
    }
    
    // Apply chord extensions to Roman numerals
    const enhancedRomanNumerals = applyChordExtensions(romanNumerals, mode, useExtendedChords);
    
    // Convert to chord symbols
    const chordSymbols = romanToChordSymbols(enhancedRomanNumerals, key, mode);
    
    // Generate actual chord objects with notes
    const progression = chordSymbols.map(symbol => {
        const parsed = parseChordSymbol(symbol);
        if (!parsed) return { root: symbol, quality: '', bass: `${symbol}${rootOctave}`, notes: [symbol] };
        const notes = getNotesFromChordSymbol(symbol, rootOctave);
        return {
            root: parsed.root,
            quality: parsed.quality,
            bass: notes[0],
            notes
        };
    });
    
    return progression;
}