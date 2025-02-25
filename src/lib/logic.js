// lib/logic.js
import { MODES } from './modes';
import { calculateModalRoot } from './core';
import { generateChordProgression, enhanceProgressionWithExtensions } from './progression-generator';
import { applyProgressionInversions, optimizeVoiceLeading } from './voice/voicing';
import { enhanceProgressionStructure } from './structure/structural-progression.js';

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
    
    // Generate chord progression with appropriate extensions through domain manager
    const progression = enhanceProgressionWithExtensions({
        length,
        key: modalRoot,
        mode,
        useExtendedChords,
        rootOctave,
        cadenceType,
        strictCadence,
        ...progressionOptions
    });
    
    // Apply voice leading optimizations through the Voice domain manager
    const voicedProgression = useInversions ? 
        optimizeVoiceLeading(progression, modalRoot, modeName, useInversions) : 
        progression;
    
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