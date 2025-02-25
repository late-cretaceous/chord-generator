// src/lib/harmonic-rhythm.js
/**
 * @module harmonic-rhythm
 * @domain Progression.Structural
 * @responsibility Manages harmonic rhythm patterns and duration assignments
 * @private Should only be used by structural-progression.js domain manager
 */

/**
 * Standard rhythm patterns with relative durations
 * Values represent relative durations (e.g. 1 = quarter note, 2 = half note)
 */
export const RHYTHM_PATTERNS = {
    // Basic patterns
    uniform: {
        name: 'Uniform',
        description: 'All chords have equal duration',
        getDurations: (length) => Array(length).fill(1)
    },
    
    waltz: {
        name: 'Waltz',
        description: 'Emphasizes first beat of three',
        getDurations: (length) => {
            const pattern = [2, 1, 1];
            return generatePatternOfLength(pattern, length);
        }
    },
    
    longShort: {
        name: 'Long-Short',
        description: 'Alternates between long and short durations',
        getDurations: (length) => {
            const pattern = [2, 1];
            return generatePatternOfLength(pattern, length);
        }
    },
    
    shortLong: {
        name: 'Short-Long',
        description: 'Alternates between short and long durations',
        getDurations: (length) => {
            const pattern = [1, 2];
            return generatePatternOfLength(pattern, length);
        }
    },
    
    // Advanced patterns
    cadential: {
        name: 'Cadential',
        description: 'Slows down at cadence points',
        getDurations: (length) => {
            // Starts normal, but final chord is longer
            const durations = Array(length).fill(1);
            if (length > 1) {
                durations[length - 1] = 2; // Final chord twice as long
                durations[length - 2] = 1.5; // Penultimate chord slightly elongated
            }
            return durations;
        }
    },
    
    rubato: {
        name: 'Rubato',
        description: 'Varied durations with expressive timing',
        getDurations: (length) => {
            // Create a varied but musical pattern
            const durations = [];
            for (let i = 0; i < length; i++) {
                if (i === 0 || i === length - 1) {
                    durations.push(2); // First and last chords longer
                } else if (i % 3 === 0) {
                    durations.push(1.5); // Every third chord slightly longer
                } else {
                    durations.push(1);
                }
            }
            return durations;
        }
    },
    
    accelerating: {
        name: 'Accelerating',
        description: 'Chords get progressively shorter',
        getDurations: (length) => {
            const durations = [];
            for (let i = 0; i < length; i++) {
                // Start with longest duration and gradually decrease
                const factor = Math.max(0.5, 1 - (i / (length * 1.5)));
                durations.push(1 + factor);
            }
            return durations;
        }
    },
    
    decelerating: {
        name: 'Decelerating',
        description: 'Chords get progressively longer',
        getDurations: (length) => {
            const durations = [];
            for (let i = 0; i < length; i++) {
                // Start with shortest duration and gradually increase
                const factor = Math.min(1.5, (i / (length - 1)) + 0.5);
                durations.push(factor);
            }
            return durations;
        }
    }
};

/**
 * Generates a rhythm pattern of specified length
 * @param {Array} pattern - Base pattern to repeat
 * @param {number} length - Desired total length
 * @returns {Array} Array of durations matching the desired length
 */
function generatePatternOfLength(pattern, length) {
    if (!pattern || pattern.length === 0) return Array(length).fill(1);
    
    const result = [];
    for (let i = 0; i < length; i++) {
        result.push(pattern[i % pattern.length]);
    }
    return result;
}

/**
 * Creates a custom harmonic rhythm pattern
 * @param {number} length - Progression length
 * @param {string|function|Array} patternType - Pattern type, custom function, or array of durations
 * @returns {Array} Durations for each chord in the progression
 */
export function createRhythmPattern(length, patternType = 'uniform') {
    // Default to uniform if length is invalid
    if (!length || length < 1) return [1];
    
    // If patternType is an array, use it directly (with length validation)
    if (Array.isArray(patternType)) {
        if (patternType.length === length) {
            return patternType;
        } else {
            return generatePatternOfLength(patternType, length);
        }
    }
    
    // If patternType is a function, call it with length
    if (typeof patternType === 'function') {
        const result = patternType(length);
        return Array.isArray(result) ? result : Array(length).fill(1);
    }
    
    // If patternType is a string, look it up in RHYTHM_PATTERNS
    if (typeof patternType === 'string' && RHYTHM_PATTERNS[patternType]) {
        return RHYTHM_PATTERNS[patternType].getDurations(length);
    }
    
    // Default to uniform pattern
    return Array(length).fill(1);
}

/**
 * Normalizes durations to fit within desired total length
 * @param {Array} durations - Array of relative durations
 * @param {number} totalBeats - Total number of beats to fill
 * @returns {Array} Normalized durations that sum to totalBeats
 */
export function normalizeDurations(durations, totalBeats = null) {
    if (!durations || durations.length === 0) return [];
    
    const sum = durations.reduce((acc, val) => acc + val, 0);
    
    // If totalBeats not specified, just return the relative durations
    if (totalBeats === null) return durations;
    
    // Scale all durations to fit the total length
    return durations.map(duration => (duration / sum) * totalBeats);
}

/**
 * Applies a harmonic rhythm pattern to a progression
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
