import { MODES } from './modes';
import { calculateModalRoot, romanToChordSymbols, getNotesFromChordSymbol, parseChordSymbol } from './core';
import { applyProgressionInversions } from './inversions';
import { enhanceMode } from './mode-enhancer';

/**
 * Gets the tonic chord Roman numeral based on the mode
 */
function getTonicChord(mode) {
    if (!mode || !mode.chordQualities) return 'I';
    const tonicQuality = mode.chordQualities.I || mode.chordQualities.i;
    return (tonicQuality === 'major' || tonicQuality === 'augmented') ? 'I' : 'i';
}

/**
 * Selects the next chord based on transition probabilities
 * FIXED: Added fallback logic to ensure proper progression
 */
function selectNextChord(currentChord, transitions, mode) {
    // If no transitions defined or no current chord, return tonic
    if (!transitions || !currentChord) return getTonicChord(mode);
    
    // Get probability distribution for current chord
    const probabilities = transitions[currentChord];
    
    // BUGFIX: If no probabilities found for this chord, use default progression
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
 * FIXED: Added validation and fallback
 */
function generateChordProgression(length = 4, mode = MODES.ionian) {
    // Fallback to ionian if no mode or transitions provided
    if (!mode) mode = MODES.ionian;
    
    // BUGFIX: Create a shallow copy of the mode to avoid modifying the original
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
    
    // Debug output
    console.log(`Starting progression with tonic: ${tonic} in ${workingMode.name} mode`);
    
    // Generate the rest of the progression
    for (let i = 1; i < length; i++) {
        const currentChord = progression[progression.length - 1];
        const nextChord = selectNextChord(currentChord, workingMode.transitions, workingMode);
        console.log(`Selected next chord: ${nextChord} after ${currentChord}`);
        progression.push(nextChord);
    }
    
    return progression;
}

/**
 * Applies chord extensions to Roman numerals based on music theory principles
 */
function applyChordExtensions(romanNumerals, mode, chordExtensionLevel) {
    if (chordExtensionLevel === 'none') return romanNumerals;
    
    return romanNumerals.map((numeral, index, array) => {
        const isLastChord = index === array.length - 1;
        const isSecondToLast = index === array.length - 2;
        
        // Different rules based on chord function and position
        
        // V chord - often gets a dominant 7th
        if ((numeral === 'V' || numeral === 'v') && 
            !isLastChord && // Not at end of progression
            Math.random() > 0.3) { // 70% chance
            return numeral + '7';
        }
        
        // ii chord - often gets a minor 7th in major keys
        if (numeral === 'ii' && Math.random() > 0.4) {
            return numeral + '7';
        }
        
        // I chord - can be major 7 if not at cadence
        if (numeral === 'I' && !isLastChord && !isSecondToLast && Math.random() > 0.6) {
            return numeral + 'maj7';
        }
        
        // i chord in minor - often minor 7
        if (numeral === 'i' && Math.random() > 0.5) {
            return numeral + '7';
        }
        
        // IV chord - can be major 7
        if (numeral === 'IV' && Math.random() > 0.6) {
            return numeral + 'maj7';
        }
        
        // VII in minor - often dominant 7
        if (numeral === 'VII' && mode.name === 'aeolian' && Math.random() > 0.4) {
            return numeral + '7';
        }
        
        // Extended chord types (9ths, etc.) with 'extended' or 'full' levels
        if (chordExtensionLevel === 'extended' || chordExtensionLevel === 'full') {
            // V9 chord sometimes
            if ((numeral === 'V' || numeral === 'v') && 
                !isLastChord && Math.random() > 0.7) {
                return numeral + '9';
            }
            
            // Occasionally use major 9th for I
            if (numeral === 'I' && !isLastChord && Math.random() > 0.8) {
                return numeral + 'maj9';
            }
        }
        
        // For most other chords, occasionally add 7ths
        if (Math.random() > 0.8) {
            // Determine 7th type based on chord quality
            if (mode.chordQualities) {
                const quality = mode.chordQualities[numeral];
                if (quality === 'major') {
                    return numeral + '7'; // Dominant 7th for major chords
                } else if (quality === 'minor') {
                    return numeral + '7'; // Minor 7th for minor chords
                }
            }
        }
        
        return numeral;
    });
}

/**
 * ENHANCED: Generates a chord progression with optional extended chord types
 */
export function generateProgression(
    length = 4, 
    key = 'C', 
    modeName = 'ionian', 
    useInversions = true, 
    rootOctave = 2,
    useExtendedChords = 'none' // 'none', 'sevenths', 'extended', 'full'
) {
    // Get the base mode
    let mode = typeof modeName === 'string' ? MODES[modeName] || MODES.ionian : modeName;
    if (!mode) mode = MODES.ionian;
    
    // Enhance the mode with extended chord qualities if requested
    if (useExtendedChords !== 'none') {
        mode = enhanceMode(mode, useExtendedChords);
    }
    
    const modalRoot = calculateModalRoot(key, mode);
    
    // Generate base Roman numeral progression
    const romanNumerals = generateChordProgression(length, mode);
    console.log('Generated Roman numerals:', romanNumerals);
    
    // Apply chord extensions to Roman numerals
    const enhancedRomanNumerals = applyChordExtensions(romanNumerals, mode, useExtendedChords);
    console.log('Enhanced Roman numerals:', enhancedRomanNumerals);
    
    // Convert to chord symbols
    const chordSymbols = romanToChordSymbols(enhancedRomanNumerals, modalRoot, mode);
    console.log('Chord symbols:', chordSymbols);
    
    // Generate actual chord objects with notes
    const progression = chordSymbols.map(symbol => {
        const parsed = parseChordSymbol(symbol);
        if (!parsed) return { root: symbol, quality: '', bass: `${symbol}${rootOctave}`, notes: [symbol] };
        const notes = getNotesFromChordSymbol(symbol, rootOctave);
        console.log(`Generated notes for ${symbol}:`, notes); // Debug
        return {
            root: parsed.root,
            quality: parsed.suffix,
            bass: notes[0],
            notes
        };
    });

    // Apply inversions if requested
    const result = useInversions ? applyProgressionInversions(progression) : progression;
    console.log('Final progression:', result); // Debug
    return result;
}