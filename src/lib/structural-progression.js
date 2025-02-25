// src/lib/structural-progression.js
/**
 * @module structural-progression
 * @domain Progression
 * @responsibility Manages structural aspects of progression generation including patterns and rhythm
 * @public Can be used by high-level coordinators like logic.js
 */

import { createRhythmPattern, normalizeDurations } from './harmonic-rhythm';
import { generatePatternProgression, combinePatternSegments } from './progression-patterns';

/**
 * Applies harmonic rhythm to a progression
 * @domain Progression.Structural
 * @calledBy Logic domain only
 * @param {Array} progression - Chord progression array
 * @param {string|function|Array} rhythmPattern - Pattern type, custom function, or durations
 * @param {number} totalBeats - Optional total beats to normalize to
 * @returns {Array} Progression with durations applied
 */
export function applyRhythmToProgression(progression, rhythmPattern = 'uniform', totalBeats = null) {
    if (!progression || progression.length === 0) return progression;
    
    // Generate durations based on pattern
    const durations = createRhythmPattern(progression.length, rhythmPattern);
    
    // Normalize if total beats specified
    const normalizedDurations = totalBeats ? normalizeDurations(durations, totalBeats) : durations;
    
    // Apply durations to progression
    return progression.map((chord, index) => ({
        ...chord,
        duration: normalizedDurations[index] || 1
    }));
}

/**
 * Generates a progression based on structural patterns
 * @domain Progression.Structural
 * @calledBy Logic domain only
 * @param {number} length - Desired length of progression
 * @param {Object} mode - Mode to use (affects pattern selection)
 * @param {string} patternType - Type of pattern to use
 * @param {Object} options - Additional options
 * @returns {Array} Roman numeral progression
 */
export function generateStructuralProgression(length, mode, patternType, options = {}) {
    const isMinor = mode.name === 'aeolian' || mode.name === 'dorian' || 
                  mode.name === 'phrygian' || mode.name === 'locrian';
    
    const patternOptions = {
        length,
        isMinor,
        startDegree: isMinor ? 'i' : 'I',
        ...options
    };
    
    // Generate progression using the pattern
    return generatePatternProgression(patternType, patternOptions);
}

/**
 * Enhances a progression with structural features
 * @domain Progression.Structural
 * @calledBy Logic domain only
 * @param {Array} progression - Base progression
 * @param {Object} options - Structural enhancement options
 * @returns {Array} Enhanced progression with rhythm and structure
 */
export function enhanceProgressionStructure(progression, options = {}) {
    if (!progression || progression.length === 0) return progression;
    
    const {
        rhythmPattern = 'uniform',
        totalBeats = null
    } = options;
    
    // Apply rhythmic variation
    return applyRhythmToProgression(progression, rhythmPattern, totalBeats);
}

/**
 * Gets available rhythm patterns
 * @domain Progression.Structural
 * @calledBy Any domain
 * @returns {Object} Map of available rhythm patterns
 */
export function getAvailableRhythmPatterns() {
    return {
        uniform: 'Uniform (Equal)',
        longShort: 'Long-Short',
        shortLong: 'Short-Long',
        waltz: 'Waltz (3-beat)',
        rubato: 'Rubato (Varied)',
        cadential: 'Cadential (Slower End)',
        accelerating: 'Accelerating',
        decelerating: 'Decelerating'
    };
}

/**
 * Gets available harmonic patterns
 * @domain Progression.Structural
 * @calledBy Any domain
 * @returns {Object} Map of available harmonic patterns
 */
export function getAvailableHarmonicPatterns() {
    return {
        twoFiveOne: 'ii-V-I Jazz',
        descendingFifths: 'Circle of Fifths',
        ascendingFifths: 'Reverse Circle of Fifths',
        modalMixture: 'Modal Mixture',
        fourOneDeceptive: 'IV-I-vi Pop'
    };
}
