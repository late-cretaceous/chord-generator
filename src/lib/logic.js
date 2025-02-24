// lib/logic.js
import { MODES } from './modes';
import { calculateModalRoot, romanToChordSymbols, getNotesFromChordSymbol, parseChordSymbol } from './core';
import { applyProgressionInversions } from './voicing';
import { generateChordProgression } from './progression-generator';
import { applyChordExtensions } from './chord-extensions';

/**
 * Generates a chord progression with optional extended chord types
 * @param {number} length - Desired progression length 
 * @param {string} key - Key center (e.g., 'C', 'F#')
 * @param {string|Object} modeName - Mode name or mode object
 * @param {boolean} useInversions - Whether to apply voice-leading inversions
 * @param {number} rootOctave - Base octave for chord voicings
 * @param {string} useExtendedChords - Level of chord extensions to apply ('none', 'sevenths', 'extended', 'full')
 * @returns {Array} Array of chord objects with notes
 */
export function generateProgression(
    length = 4, 
    key = 'C', 
    modeName = 'ionian', 
    useInversions = true, 
    rootOctave = 2,
    useExtendedChords = 'none'
) {
    // Get the base mode
    let mode = typeof modeName === 'string' ? MODES[modeName] || MODES.ionian : modeName;
    if (!mode) mode = MODES.ionian;
    
    const modalRoot = calculateModalRoot(key, mode);
    
    // Generate base Roman numeral progression
    const romanNumerals = generateChordProgression(length, mode);
    
    // Apply chord extensions to Roman numerals
    const enhancedRomanNumerals = applyChordExtensions(romanNumerals, mode, useExtendedChords);
    
    // Convert to chord symbols
    const chordSymbols = romanToChordSymbols(enhancedRomanNumerals, modalRoot, mode);
    
    // Generate actual chord objects with notes
    const progression = chordSymbols.map(symbol => {
        const parsed = parseChordSymbol(symbol);
        if (!parsed) return { root: symbol, quality: '', bass: `${symbol}${rootOctave}`, notes: [symbol] };
        const notes = getNotesFromChordSymbol(symbol, rootOctave);
        return {
            root: parsed.root,
            quality: parsed.suffix,
            bass: notes[0],
            notes
        };
    });

    // Apply inversions if requested
    const result = useInversions ? applyProgressionInversions(progression) : progression;
    
    return result;
}