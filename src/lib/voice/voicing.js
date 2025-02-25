// lib/voicing.js
import { NOTES, pitchToMidi, midiToPitch } from '../core';
import { resetMelodicState } from './melodic-state';
import { 
    calculateVoiceLeadingScore, 
    getInversionBias,
    analyzeCadentialPattern,
    analyzeLeadingToneResolution,
    optimizeLeadingToneVoicing,
    hasLeadingTone
} from './voice-leading-analysis';
import {
    applyCadentialPattern,
    suggestCadentialPattern
} from './cadential-patterns';

/**
 * Gets all possible inversions for a chord
 * @param {Object} chord - Chord object with notes array
 * @returns {Array} Array of inversion objects
 */
export function getInversions(chord) {
    if (!chord.notes || !chord.notes.length) return [];
    const inversions = [];
    const baseNotes = chord.notes.map(note => note.replace(/[0-9]/, '')); // Pitch classes: ["G", "B", "D"]
    const baseOctave = parseInt(chord.notes[0].slice(-1)); // e.g., 2 from "G2"
    
    for (let i = 0; i < baseNotes.length; i++) {
        const reorderedNotes = [...baseNotes.slice(i), ...baseNotes.slice(0, i)]; // e.g., ["D", "G", "B"]
        const notes = reorderedNotes.map(note => {
            const noteMidi = pitchToMidi(note, baseOctave); // All in same octave
            return midiToPitch(noteMidi);
        });
        inversions.push({
            inversion: i,
            bassNote: notes[0],
            notes
        });
    }
    
    return inversions;
}

/**
 * Select the best inversion based on voice leading criteria
 * @param {Array} inversions - Array of possible inversions
 * @param {Array} previousChordNotes - Notes of the previous chord
 * @param {number} progressionLength - Total progression length
 * @param {number} chordIndex - Position in the progression
 * @param {Object} prevChordObj - Previous chord object
 * @param {Object} nextChordObj - Next chord object
 * @param {string} key - Key center (for leading tone analysis)
 * @returns {Object} The best inversion
 */
function selectBestInversion(
    inversions, 
    previousChordNotes, 
    progressionLength, 
    chordIndex, 
    prevChordObj, 
    nextChordObj,
    key = 'C'
) {
    if (!inversions.length) return null;
    if (!previousChordNotes || !previousChordNotes.length) return inversions[0];

    const weightedInversions = inversions.map(inv => {
        // Calculate voice leading score with enhanced melodic factors
        const score = calculateVoiceLeadingScore(
            previousChordNotes, 
            inv.notes, 
            progressionLength, 
            chordIndex,
            prevChordObj,
            nextChordObj
        ) + getInversionBias(inv.inversion, chordIndex, progressionLength);
        
        // Apply cadential bonus/penalty
        let cadentialAdjustment = 0;
        if (nextChordObj && chordIndex >= progressionLength - 2) {
            const cadentialAnalysis = analyzeCadentialPattern(
                { ...prevChordObj, notes: inv.notes },
                nextChordObj,
                chordIndex,
                progressionLength
            );
            
            if (cadentialAnalysis.isCadential) {
                if (cadentialAnalysis.isAuthenticCadence) {
                    cadentialAdjustment -= 2; // Bonus for authentic cadence
                    
                    if (cadentialAnalysis.isPerfectAuthenticCadence) {
                        cadentialAdjustment -= 3; // Extra bonus for perfect authentic cadence
                    }
                }
            }
        }
        
        // Apply leading tone bonus/penalty
        let leadingToneAdjustment = 0;
        if (nextChordObj && hasLeadingTone({ ...prevChordObj, notes: inv.notes }, key)) {
            const ltAnalysis = analyzeLeadingToneResolution(
                previousChordNotes,
                inv.notes,
                prevChordObj,
                nextChordObj
            );
            
            if (ltAnalysis.hasLeadingTone) {
                if (ltAnalysis.resolvesCorrectly) {
                    leadingToneAdjustment -= 3; // Bonus for proper leading tone resolution
                } else {
                    leadingToneAdjustment += 4; // Penalty for improper leading tone handling
                }
            }
        }
                  
        return { 
            ...inv, 
            score: score + cadentialAdjustment + leadingToneAdjustment 
        };
    });

    // Sort by score (lower is better)
    return weightedInversions.sort((a, b) => a.score - b.score)[0];
}

/**
 * Assess whether an inversion would improve the progression
 * @param {Object} currentChord - Current chord object
 * @param {Object} previousChord - Previous chord object
 * @param {number} progressionLength - Total progression length
 * @param {number} chordIndex - Position in the progression
 * @param {Array} progression - Full progression array
 * @param {string} key - Key center (for leading tone analysis)
 * @returns {Object} Assessment result with best inversion
 */
function assessInversionBenefit(
    currentChord, 
    previousChord, 
    progressionLength, 
    chordIndex,
    progression,
    key = 'C'
) {
    if (!previousChord || !previousChord.notes.length) {
        return { shouldInvert: false, bestInversion: null };
    }

    const inversions = getInversions(currentChord);
    if (!inversions.length) {
        return { shouldInvert: false, bestInversion: null };
    }

    // Get the next chord if available (for context-aware decisions)
    const nextChord = chordIndex < progression.length - 1 ? progression[chordIndex + 1] : null;
    
    // Calculate score for root position
    const rootScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        inversions[0].notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    );
    
    // Find best inversion with enhanced scoring
    const bestInversion = selectBestInversion(
        inversions, 
        previousChord.notes, 
        progressionLength, 
        chordIndex,
        previousChord,
        nextChord,
        key
    );
    
    const bestScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        bestInversion.notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    );

    // Handle special cases for cadential patterns
    let shouldInvert = (rootScore - bestScore) > 0.8; // Basic threshold
    
    // If this is at the end of the progression, make additional checks
    if (chordIndex >= progressionLength - 2 && nextChord) {
        // For authentic cadences, prefer certain inversions
        const isAuthenticCadence = 
            (currentChord.root !== nextChord.root) && // Different roots
            (nextChord.bass && nextChord.bass.startsWith(nextChord.root)); // Next chord in root position
            
        if (isAuthenticCadence) {
            // For dominant chords moving to tonic, ensure leading tone handling
            if (hasLeadingTone(currentChord, nextChord.root)) {
                // Calculate additional score factor for leading tone resolution
                const ltAnalysis = analyzeLeadingToneResolution(
                    previousChord.notes,
                    bestInversion.notes,
                    previousChord,
                    nextChord
                );
                
                if (ltAnalysis.hasLeadingTone && !ltAnalysis.resolvesCorrectly) {
                    // Strongly encourage inversion if it fixes leading tone resolution
                    shouldInvert = true;
                }
            }
        }
    }

    return { shouldInvert, bestInversion };
}

/**
 * Format chord symbol with inversion notation
 * @param {string} root - Root note
 * @param {string} quality - Chord quality
 * @param {string} bassNote - Bass note
 * @returns {string} Formatted chord symbol
 */
export function formatInversionSymbol(root, quality, bassNote) {
    if (!bassNote || bassNote.startsWith(root)) return root + quality;
    return `${root}${quality}/${bassNote.replace(/[0-9]/, '')}`;
}

/**
 * Optimize leading tone treatment in a progression
 * @param {Array} progression - Array of chord objects
 * @param {string} key - Key center (tonic)
 * @param {string} modeName - Name of the mode
 * @returns {Array} Progression with optimized leading tones
 */
function optimizeLeadingTones(progression, key, modeName) {
    if (!progression || progression.length < 2) return progression;
    
    const result = [];
    
    for (let i = 0; i < progression.length; i++) {
        const currentChord = progression[i];
        const isNearEnd = i >= progression.length - 2;
        const nextChord = i < progression.length - 1 ? progression[i + 1] : null;
        
        // Apply leading tone optimization for dominant chords at cadence points
        // But only with 70% probability to maintain variety
        if (isNearEnd && nextChord && hasLeadingTone(currentChord, nextChord.root) && Math.random() < 0.7) {
            const optimizedChord = optimizeLeadingToneVoicing(currentChord, nextChord.root);
            result.push(optimizedChord);
        } else {
            result.push(currentChord);
        }
    }
    
    return result;
}

/**
 * Apply cadential patterns to Roman numeral progressions
 * @param {Array} romanNumerals - Array of Roman numeral chord symbols
 * @param {string} modeName - Name of the mode
 * @param {string} cadenceType - Type of cadence to apply (null for automatic)
 * @param {boolean} strictCadence - Whether to strictly enforce the cadence
 * @returns {Array} Modified progression with cadential pattern
 */
export function applyCadentialPatterns(romanNumerals, modeName, cadenceType = null, strictCadence = false) {
    if (!romanNumerals || romanNumerals.length < 2) return romanNumerals;
    
    // Add variety to cadence handling
    if (strictCadence && cadenceType) {
        // Strict enforcement of specified cadence
        return applyCadentialPattern(romanNumerals, modeName, cadenceType);
    } else if (cadenceType) {
        // Apply specified cadence with 50% probability
        if (Math.random() < 0.5) {
            return applyCadentialPattern(romanNumerals, modeName, cadenceType);
        }
    } else if (Math.random() < 0.4) {
        // 40% chance to apply a suggested cadence for more variety
        const suggestedCadence = suggestCadentialPattern(romanNumerals, modeName);
        return applyCadentialPattern(romanNumerals, modeName, suggestedCadence);
    }
    
    // Otherwise, keep original progression
    return romanNumerals;
}

/**
 * Apply all voice-related optimizations to a progression
 * @param {Array} progression - Array of chord objects
 * @param {string} key - Key center (tonic)
 * @param {string} modeName - Name of the mode
 * @param {boolean} useInversions - Whether to apply inversions
 * @returns {Array} Progression with optimized voices
 */
export function optimizeVoiceLeading(progression, key, modeName, useInversions = true) {
    if (!progression || progression.length === 0) return progression;
    
    // First optimize leading tones
    const ltOptimized = optimizeLeadingTones(progression, key, modeName);
    
    // Then apply inversions if requested
    if (useInversions) {
        return applyProgressionInversions(ltOptimized, key);
    }
    
    return ltOptimized;
}

/**
 * Apply inversions to a progression with enhanced voice leading
 * @param {Array} progression - Array of chord objects
 * @param {string} key - Key center (for leading tone analysis)
 * @returns {Array} Progression with optimized inversions
 */
export function applyProgressionInversions(progression, key = 'C') {
    if (!progression || progression.length === 0) return progression;

    const result = [];
    let previousChord = null;
    
    // Reset melodic state at the start of a new progression
    resetMelodicState();

    progression.forEach((chord, chordIndex) => {
        // Standard inversion assessment
        const { shouldInvert, bestInversion } = assessInversionBenefit(
            chord, 
            previousChord, 
            progression.length,
            chordIndex,
            progression,
            key
        );
        
        if (shouldInvert && bestInversion && bestInversion.inversion !== 0) {
            result.push({
                root: chord.root,
                quality: chord.quality,
                bass: bestInversion.bassNote,
                notes: bestInversion.notes
            });
            previousChord = { ...chord, notes: bestInversion.notes };
        } else {
            result.push(chord);
            previousChord = chord;
        }
    });

    return result;
}