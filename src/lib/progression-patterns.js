// src/lib/progression-patterns.js
/**
 * @module progression-patterns
 * @domain Progression.Structural
 * @responsibility Defines and applies common harmonic patterns and sequences
 * @private Should only be used by structural-progression.js domain manager
 */

import { NOTES, getScaleDegreeRoot } from './core';

/**
 * Common harmonic pattern definitions with pattern functions
 */
export const HARMONIC_PATTERNS = {
    // Standard progression patterns
    basicCadence: {
        name: 'Basic Authentic Cadence',
        description: 'Simple V-I cadence pattern',
        generatePattern: (options = {}) => ['V', 'I']
    },
    
    plagalCadence: {
        name: 'Plagal Cadence',
        description: 'IV-I cadence pattern',
        generatePattern: (options = {}) => ['IV', 'I']
    },
    
    twoFiveOne: {
        name: 'ii-V-I',
        description: 'Common jazz progression',
        generatePattern: (options = {}) => {
            return options.isMinor ? ['ii°', 'V', 'i'] : ['ii', 'V', 'I'];
        }
    },
    
    fourOneDeceptive: {
        name: 'IV-I-vi',
        description: 'Four-one progression with deceptive cadence',
        generatePattern: (options = {}) => {
            return options.isMinor ? ['iv', 'i', 'VI'] : ['IV', 'I', 'vi'];
        }
    },
    
    // Sequence patterns
    descendingFifths: {
        name: 'Circle of Fifths',
        description: 'Chords descend by fifth intervals',
        generatePattern: (options = {}) => {
            const length = options.length || 4;
            const startDegree = options.startDegree || (options.isMinor ? 'i' : 'I');
            
            const major = ['I', 'IV', 'vii°', 'iii', 'vi', 'ii', 'V', 'I'];
            const minor = ['i', 'iv', 'VII', 'III', 'VI', 'ii°', 'V', 'i'];
            
            const sequence = options.isMinor ? minor : major;
            
            // Find start point in sequence
            let startIndex = sequence.indexOf(startDegree);
            if (startIndex === -1) startIndex = 0;
            
            // Extract pattern of requested length
            const result = [];
            for (let i = 0; i < length; i++) {
                result.push(sequence[(startIndex + i) % sequence.length]);
            }
            
            return result;
        }
    },
    
    ascendingFifths: {
        name: 'Reverse Circle of Fifths',
        description: 'Chords ascend by fifth intervals',
        generatePattern: (options = {}) => {
            const length = options.length || 4;
            const startDegree = options.startDegree || (options.isMinor ? 'i' : 'I');
            
            const major = ['I', 'V', 'ii', 'vi', 'iii', 'vii°', 'IV', 'I'];
            const minor = ['i', 'V', 'ii°', 'VI', 'III', 'VII', 'iv', 'i'];
            
            const sequence = options.isMinor ? minor : major;
            
            // Find start point in sequence
            let startIndex = sequence.indexOf(startDegree);
            if (startIndex === -1) startIndex = 0;
            
            // Extract pattern of requested length
            const result = [];
            for (let i = 0; i < length; i++) {
                result.push(sequence[(startIndex + i) % sequence.length]);
            }
            
            return result;
        }
    },
    
    rosialia: {
        name: 'Rosalia',
        description: 'Sequential pattern descending by major or minor thirds',
        generatePattern: (options = {}) => {
            const length = options.length || 6;
            const startDegree = options.startDegree || (options.isMinor ? 'i' : 'I');
            const startRoot = options.startRoot || 'C';
            
            // Calculate actual root of start degree
            const scaleDegree = startDegree.replace(/[^ivIV]/g, '');
            const quality = /[a-z]/.test(startDegree) ? 'minor' : 'major';
            
            // Generate pattern descending by thirds
            const result = [startDegree];
            let currentRoot = startRoot;
            
            for (let i = 1; i < length; i++) {
                // Calculate new root - descending major third (4 semitones down)
                const currentRootIndex = NOTES.indexOf(currentRoot);
                if (currentRootIndex === -1) break;
                
                // Calculate next root (3 semitones down for minor third, 4 for major third)
                const intervalDown = options.isMinor ? 3 : 4;
                const newRootIndex = (currentRootIndex - intervalDown + 12) % 12;
                currentRoot = NOTES[newRootIndex];
                
                // Add to results, maintaining same chord quality
                result.push(scaleDegree);
            }
            
            return result;
        }
    },
    
    // Modal interchange patterns
    modalMixture: {
        name: 'Modal Mixture',
        description: 'Incorporates chords from parallel major/minor',
        generatePattern: (options = {}) => {
            if (options.isMinor) {
                // Minor key with major key mixture
                return ['i', 'IV', 'V', 'i'];
            } else {
                // Major key with minor key mixture
                return ['I', 'iv', 'V', 'I'];
            }
        }
    },
    
    majorMinorTwist: {
        name: 'Major-Minor Twist',
        description: 'Alternates between major and minor tonality',
        generatePattern: (options = {}) => {
            const length = options.length || 4;
            const result = [];
            
            for (let i = 0; i < length; i++) {
                if (i % 2 === 0) {
                    // Even positions - use home key
                    result.push(options.isMinor ? 'i' : 'I');
                } else {
                    // Odd positions - use parallel key
                    result.push(options.isMinor ? 'I' : 'i');
                }
            }
            
            return result;
        }
    }
};

/**
 * Applies a specific harmonic pattern to generate a progression
 * @param {string} patternName - Name of the pattern to apply
 * @param {Object} options - Options for pattern generation
 * @returns {Array} Roman numeral progression
 */
export function generatePatternProgression(patternName, options = {}) {
    // Default options
    const defaultOptions = {
        length: 4,
        isMinor: false,
        startDegree: null,
        startRoot: 'C'
    };
    
    const fullOptions = { ...defaultOptions, ...options };
    
    // Get the pattern generator
    const pattern = HARMONIC_PATTERNS[patternName];
    if (!pattern || !pattern.generatePattern) {
        console.warn(`Pattern ${patternName} not found, using default sequence`);
        return fullOptions.isMinor ? ['i', 'iv', 'V', 'i'] : ['I', 'IV', 'V', 'I'];
    }
    
    // Generate the pattern
    return pattern.generatePattern(fullOptions);
}

/**
 * Creates a sequence pattern by transposing a motif
 * @param {Array} motif - Base progression motif as Roman numerals
 * @param {Array} rootSequence - Sequence of roots to transpose to
 * @param {Object} mode - Mode definition
 * @returns {Array} Full sequence as Roman numerals
 */
export function createSequence(motif, rootSequence, mode) {
    if (!motif || !motif.length || !rootSequence || !rootSequence.length) {
        return motif || [];
    }
    
    const result = [];
    
    // Add each transposition of the motif
    for (const root of rootSequence) {
        // Transpose the motif to the new root
        for (const chord of motif) {
            // For now, just append the chord - this is a simplified approach
            // A more advanced implementation would transpose the chord qualities correctly
            result.push(chord);
        }
    }
    
    return result;
}

/**
 * Combines multiple pattern segments into a full progression
 * @param {Array} segments - Array of pattern segments
 * @param {number} targetLength - Desired total length (optional)
 * @returns {Array} Combined progression
 */
export function combinePatternSegments(segments, targetLength = null) {
    if (!segments || segments.length === 0) return [];
    
    // Flatten all segments into a single array
    const combined = segments.flat();
    
    // If no target length specified, return as is
    if (targetLength === null || targetLength <= 0) return combined;
    
    // If too short, repeat the pattern
    if (combined.length < targetLength) {
        const repeats = Math.ceil(targetLength / combined.length);
        const repeated = [];
        
        for (let i = 0; i < repeats; i++) {
            repeated.push(...combined);
        }
        
        return repeated.slice(0, targetLength);
    }
    
    // If too long, truncate
    return combined.slice(0, targetLength);
}
