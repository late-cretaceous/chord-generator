// lib/logic.js
import { MODES } from './modes';
import { calculateModalRoot, romanToChordSymbols, getNotesFromChordSymbol, parseChordSymbol } from './core';
import { applyProgressionInversions } from './voice/voicing';
import { generateChordProgression } from './progression-generator';
import { applyChordExtensions } from './chord-extensions';
import { applyCadentialPattern, suggestCadentialPattern } from './voice/cadential-patterns';
import { enhanceProgressionStructure, generateStructuralProgression } from './structure/structural-progression.js';
import { optimizeLeadingToneVoicing, hasLeadingTone } from './voice/voice-leading-analysis';

/**
 * Generates a chord progression with optional extended chord types,
 * enhanced cadential patterns, and variable harmonic rhythm
 * 
 * @param {number} length - Desired progression length 
 * @param {string} key - Key center (e.g., 'C', 'F#')
 * @param {string|Object} modeName - Mode name or mode object
 * @param {boolean} useInversions - Whether to apply voice-leading inversions
 * @param {number} rootOctave - Base octave for chord voicings
 * @param {string} useExtendedChords - Level of chord extensions to apply ('none', 'sevenths', 'extended', 'full')
 * @param {string} cadenceType - Type of cadence to enforce (null for automatic/varied selection)
 * @param {boolean} strictCadence - Whether to strictly enforce the cadence (false for more variety)
 * @param {Object} structuralOptions - Options for structural generation features
 * @returns {Array} Array of chord objects with notes
 */
export function generateProgression(
    length = 4, 
    key = 'C', 
    modeName = 'ionian', 
    useInversions = true, 
    rootOctave = 2,
    useExtendedChords = 'none',
    cadenceType = null,
    strictCadence = false,
    structuralOptions = {}
) {
    // Get the base mode
    let mode = typeof modeName === 'string' ? MODES[modeName] || MODES.ionian : modeName;
    if (!mode) mode = MODES.ionian;
    
    const modalRoot = calculateModalRoot(key, mode);
    
    // Extract structural generation options
    const { 
        rhythmPattern = 'uniform',
        patternType = null,
        totalBeats = null,
        useStructuralPattern = false
    } = structuralOptions;
    
    // Additional options for progression generation
    const progressionOptions = {
        pattern: patternType,
        useStructuralPattern: useStructuralPattern
    };
    
    // Generate base Roman numeral progression
    let romanNumerals = generateChordProgression(length, mode, progressionOptions);
    
    // Add variety to cadence handling
    if (strictCadence && cadenceType) {
        // Strict enforcement of specified cadence
        romanNumerals = applyCadentialPattern(romanNumerals, modeName, cadenceType);
    } else if (cadenceType) {
        // Apply specified cadence with 50% probability
        if (Math.random() < 0.5) {
            romanNumerals = applyCadentialPattern(romanNumerals, modeName, cadenceType);
        }
    } else if (Math.random() < 0.4) {
        // 40% chance to apply a suggested cadence for more variety
        const suggestedCadence = suggestCadentialPattern(romanNumerals, modeName);
        romanNumerals = applyCadentialPattern(romanNumerals, modeName, suggestedCadence);
    }
    
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

    // Apply leading tone optimization (only at cadence points and only sometimes)
    const optimizedProgression = [];
    
    for (let i = 0; i < progression.length; i++) {
        const currentChord = progression[i];
        const isNearEnd = i >= progression.length - 2;
        const nextChord = i < progression.length - 1 ? progression[i + 1] : null;
        
        // Apply leading tone optimization for dominant chords at cadence points
        // But only with 70% probability to maintain variety
        if (isNearEnd && nextChord && hasLeadingTone(currentChord, nextChord.root) && Math.random() < 0.7) {
            const optimizedChord = optimizeLeadingToneVoicing(currentChord, nextChord.root);
            optimizedProgression.push(optimizedChord);
        } else {
            optimizedProgression.push(currentChord);
        }
    }
    
    // Apply inversions if requested
    const voicedProgression = useInversions ? 
        applyProgressionInversions(optimizedProgression, modalRoot) : 
        optimizedProgression;
    
    // Apply harmonic rhythm variations through the structural domain manager
    const structuralOptions2 = { rhythmPattern, totalBeats };
    const finalProgression = enhanceProgressionStructure(voicedProgression, structuralOptions2);
    
    return finalProgression;
}

/**
 * Generates a chord progression with specific structural patterns and harmonic rhythm
 * 
 * @param {Object} options - Generation options
 * @returns {Array} Array of chord objects with notes and durations
 */
export function generateStructuredProgression(options = {}) {
    // Default options
    const defaultOptions = {
        length: 4,
        key: 'C',
        mode: 'ionian',
        useInversions: true,
        rootOctave: 2,
        useExtendedChords: 'none',
        harmonicRhythm: 'uniform',
        patternType: null,
        totalBeats: 8
    };
    
    // Merge with user options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Extract options for the main generator
    const {
        length,
        key,
        mode,
        useInversions,
        rootOctave,
        useExtendedChords,
        harmonicRhythm,
        patternType,
        useStructuralPattern,
        totalBeats
    } = mergedOptions;
    
    // Build structural options
    const structuralOptions = {
        rhythmPattern: harmonicRhythm,
        patternType: patternType,
        useStructuralPattern: useStructuralPattern,
        totalBeats: totalBeats
    };
    
    // Generate the progression
    return generateProgression(
        length,
        key,
        mode,
        useInversions,
        rootOctave,
        useExtendedChords,
        null,
        false,
        structuralOptions
    );
}