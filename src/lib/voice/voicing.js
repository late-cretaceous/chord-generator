// lib/voice/voicing.js
/**
 * @module voicing
 * @domain Voice
 * @responsibility Coordinates the application of inversions to chord progressions based on voice-leading principles
 * @public Domain manager that serves as the primary interface for optimizing chord voicings
 */

import { NOTES, pitchToMidi, midiToPitch } from '../core';
import { resetMelodicState, updateMelodyState, getMelodicState } from './melodic-state';
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
    suggestCadentialPattern,
    hasLeadingTone as hasLeadingToneInChord
} from './cadential-patterns';

/**
 * Gets all possible inversions for a chord with proper voice spacing across octaves
 * @param {Object} chord - Chord object with notes array
 * @returns {Array} Array of inversion objects with properly spaced voices
 */
export function getInversions(chord) {
    if (!chord.notes || !chord.notes.length) return [];
    
    const inversions = [];
    const baseNotes = chord.notes.map(note => note.replace(/[0-9]/, '')); // Pitch classes only
    const baseOctave = parseInt(chord.notes[0].slice(-1)); // e.g., 2 from "G2"
    
    // For each inversion (bass note option)
    for (let i = 0; i < baseNotes.length; i++) {
        // Reorder notes to put the inversion note first (as bass)
        const reorderedNotes = [...baseNotes.slice(i), ...baseNotes.slice(0, i)];
        
        // Create voicings with different octave distributions
        const voicings = createVoicingsForInversion(reorderedNotes, baseOctave);
        
        // Add each voicing as a separate inversion option
        voicings.forEach((notes, idx) => {
            inversions.push({
                inversion: i,
                bassNote: notes[0],
                notes,
                spacing: idx // Type of spacing (0=close, 1=open, etc.)
            });
        });
    }
    
    return inversions;
}

/**
 * Creates multiple voicing options for a single inversion with different octave distributions
 * @param {Array} noteOrder - Array of note names in desired order (bass first)
 * @param {number} baseOctave - Starting octave for the bass note
 * @returns {Array} Array of note arrays with different voicing options
 */
function createVoicingsForInversion(noteOrder, baseOctave) {
    const voicings = [];
    
    // 1. Create close voicing (traditional)
    const closeVoicing = [];
    let currentOctave = baseOctave;
    let previousMidi = -100;
    
    for (let i = 0; i < noteOrder.length; i++) {
        const note = noteOrder[i];
        const noteMidi = pitchToMidi(note, currentOctave);
        
        // For bass note
        if (i === 0) {
            closeVoicing.push(`${note}${currentOctave}`);
            previousMidi = noteMidi;
            continue;
        }
        
        // If this note is lower than previous (in this octave), raise its octave
        if (noteMidi <= previousMidi) {
            const higherOctave = currentOctave + 1;
            closeVoicing.push(`${note}${higherOctave}`);
            previousMidi = pitchToMidi(note, higherOctave);
        } else {
            closeVoicing.push(`${note}${currentOctave}`);
            previousMidi = noteMidi;
        }
    }
    
    voicings.push(closeVoicing);
    
    // 2. Create open voicing (spread across octaves)
    const openVoicing = [];
    let spreadOctave = baseOctave;
    previousMidi = -100;
    
    for (let i = 0; i < noteOrder.length; i++) {
        const note = noteOrder[i];
        
        // Bass stays in the base octave
        if (i === 0) {
            openVoicing.push(`${note}${spreadOctave}`);
            previousMidi = pitchToMidi(note, spreadOctave);
            continue;
        }
        
        // For triads, put the third up an octave and the fifth in between
        if (noteOrder.length <= 3) {
            if (i === 1) { // Third - raise it up an octave
                const newOctave = spreadOctave + 1;
                openVoicing.push(`${note}${newOctave}`);
                previousMidi = pitchToMidi(note, newOctave);
            } else { // Fifth or remaining tones
                // If this note would be lower than previous in current octave, raise it
                const currentMidi = pitchToMidi(note, spreadOctave);
                if (currentMidi <= previousMidi) {
                    const newOctave = spreadOctave + 1;
                    openVoicing.push(`${note}${newOctave}`);
                    previousMidi = pitchToMidi(note, newOctave);
                } else {
                    openVoicing.push(`${note}${spreadOctave}`);
                    previousMidi = currentMidi;
                }
            }
        } 
        // For seventh chords and extended chords, distribute more evenly
        else {
            // Third and seventh up an octave, fifth in base octave
            if (i === 1 || i === 3) { // Third or seventh
                const newOctave = spreadOctave + 1;
                openVoicing.push(`${note}${newOctave}`);
                previousMidi = pitchToMidi(note, newOctave);
            } else if (i >= 4) { // Extensions (9th, 11th, 13th)
                const newOctave = spreadOctave + 2; // Two octaves up
                openVoicing.push(`${note}${newOctave}`);
                previousMidi = pitchToMidi(note, newOctave);
            } else { // Fifth stays in base octave
                openVoicing.push(`${note}${spreadOctave}`);
                previousMidi = pitchToMidi(note, spreadOctave);
            }
        }
    }
    
    voicings.push(openVoicing);
    
    // 3. Create drop-2 voicing (popular for jazz guitar/piano)
    // This drops the second-highest voice down an octave
    if (noteOrder.length >= 4) {
        const drop2Voicing = [...closeVoicing];
        const secondHighestIdx = drop2Voicing.length - 2;
        const note = drop2Voicing[secondHighestIdx];
        const pitch = note.replace(/[0-9]/, '');
        const octave = parseInt(note.slice(-1)) - 1;
        drop2Voicing[secondHighestIdx] = `${pitch}${octave}`;
        voicings.push(drop2Voicing);
    }
    
    return voicings;
}

/**
 * Analyzes voice spacing and quality with a focus on reducing muddiness
 * @param {Array} notes - Array of notes in the chord
 * @returns {number} Penalty score (higher is worse)
 */
function analyzeVoiceSpacing(notes) {
    if (!notes || notes.length < 2) return 0;
    
    let penalty = 0;
    const midiNotes = notes.map(note => {
        const pitch = note.replace(/[0-9]/, '');
        const octave = parseInt(note.slice(-1));
        return pitchToMidi(pitch, octave);
    });
    
    // Sort MIDI notes from low to high
    midiNotes.sort((a, b) => a - b);
    
    // Check spacing between adjacent voices
    for (let i = 0; i < midiNotes.length - 1; i++) {
        const interval = midiNotes[i+1] - midiNotes[i];
        
        // Penalize small intervals in lower registers (most critical for clarity)
        if (interval < 4) {
            // How low are we? Lower = worse penalty
            const registerFactor = Math.max(0, (48 - midiNotes[i]) / 12); // MIDI 48 = C3
            // Severe penalty for close voices in the bass register
            penalty += (4 - interval) * (registerFactor * 2 + 1);
        }
        
        // Moderate penalty for voices more than an octave apart
        if (interval > 12 && interval < 19) {
            penalty += (interval - 12) * 0.1; // Small penalty
        } else if (interval >= 19) {
            penalty += (interval - 12) * 0.3; // Larger penalty for very wide intervals
        }
    }
    
    // Check overall range and distribution
    const range = midiNotes[midiNotes.length - 1] - midiNotes[0];
    if (range < 12 && midiNotes[0] < 48) {
        // Severely penalize compressed voicings in low register
        penalty += (12 - range) * 2;
    }
    
    // Check for "muddy" voicings - three or more notes clustered in low register
    let lowClusterCount = 0;
    for (const midi of midiNotes) {
        if (midi < 48) { // Below C3
            lowClusterCount++;
        }
    }
    
    if (lowClusterCount >= 3) {
        penalty += lowClusterCount * 3; // Severe penalty for low register clusters
    }
    
    return penalty;
}

/**
 * Select the best inversion based on improved voice leading criteria
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

    // Give extra weight to voice distribution in lower registers
    const weightedInversions = inversions.map(inv => {
        // Calculate basic voice leading score
        let score = calculateVoiceLeadingScore(
            previousChordNotes, 
            inv.notes, 
            progressionLength, 
            chordIndex,
            prevChordObj,
            nextChordObj
        );
        
        // Add inversion bias
        score += getInversionBias(inv.inversion, chordIndex, progressionLength);
        
        // Add spacing penalty - crucial for avoiding muddy voicings
        score += analyzeVoiceSpacing(inv.notes);
        
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
        
        // Consider the voicing type - slightly prefer open voicings for clarity
        let voicingTypeAdjustment = 0;
        if (inv.spacing === 1) { // Open voicing
            voicingTypeAdjustment -= 1.5; // Preference for open voicings
        } else if (inv.spacing === 2) { // Drop-2 voicing
            voicingTypeAdjustment -= 1.2; // Slight preference
        }
                  
        return { 
            ...inv, 
            score: score + cadentialAdjustment + leadingToneAdjustment + voicingTypeAdjustment 
        };
    });

    // Sort by score (lower is better)
    return weightedInversions.sort((a, b) => a.score - b.score)[0];
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
 * Optimize leading tone treatment in a progression
 * @param {Array} progression - Array of chord objects
 * @param {string} key - Key center (tonic)
 * @returns {Array} Progression with optimized leading tones
 */
export function optimizeLeadingTones(progression, key) {
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
    if (!previousChord || !previousChord.notes || !previousChord.notes.length) {
        return { shouldInvert: false, bestInversion: null };
    }

    const inversions = getInversions(currentChord);
    if (!inversions.length) {
        return { shouldInvert: false, bestInversion: null };
    }

    // Get the next chord if available (for context-aware decisions)
    const nextChord = chordIndex < progression.length - 1 ? progression[chordIndex + 1] : null;
    
    // Find root position (not necessarily the first inversion in our array)
    const rootPositionInv = inversions.find(inv => inv.inversion === 0 && inv.spacing === 0);
    
    if (!rootPositionInv) {
        return { shouldInvert: false, bestInversion: inversions[0] };
    }
    
    // Calculate score for root position
    const rootScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        rootPositionInv.notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    ) + analyzeVoiceSpacing(rootPositionInv.notes);
    
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
    
    if (!bestInversion) {
        return { shouldInvert: false, bestInversion: null };
    }
    
    // Calculate comprehensive score for best inversion
    const bestScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        bestInversion.notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    ) + analyzeVoiceSpacing(bestInversion.notes);

    // Determine if we should invert based on score difference and context
    
    // Basic threshold - is the best inversion significantly better?
    let shouldInvert = (rootScore - bestScore) > 1.5;
    
    // Special case for first chord
    if (chordIndex === 0) {
        // Prefer root position for first chord (80% of the time)
        shouldInvert = shouldInvert && (Math.random() > 0.8);
    }
    
    // Special cases for cadential patterns
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
        
        // For final chord, strongly prefer root position (90% of the time)
        if (chordIndex === progressionLength - 1) {
            shouldInvert = shouldInvert && (Math.random() > 0.9);
        }
    }
    
    // Always use inversions to fix severe muddiness issues
    const rootSpacingScore = analyzeVoiceSpacing(rootPositionInv.notes);
    const invSpacingScore = analyzeVoiceSpacing(bestInversion.notes);
    
    if (rootSpacingScore > 8 && invSpacingScore < rootSpacingScore * 0.6) {
        // Root position is very muddy and inversion is much clearer
        shouldInvert = true;
    }

    return { shouldInvert, bestInversion };
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
    const ltOptimized = optimizeLeadingTones(progression, key);
    
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
        // For first chord, just use root position 90% of the time
        if (chordIndex === 0) {
            // 90% chance to keep first chord in root position
            if (Math.random() < 0.9) {
                result.push(chord);
                previousChord = chord;
                return;
            }
        }
        
        // Standard inversion assessment
        const { shouldInvert, bestInversion } = assessInversionBenefit(
            chord, 
            previousChord, 
            progression.length,
            chordIndex,
            progression,
            key
        );
        
        if (shouldInvert && bestInversion) {
            // Create new chord object with the selected inversion
            result.push({
                root: chord.root,
                quality: chord.quality,
                bass: bestInversion.bassNote,
                notes: bestInversion.notes,
                duration: chord.duration // Preserve duration if present
            });
            previousChord = { ...chord, notes: bestInversion.notes };
        } else {
            // Keep original chord
            result.push(chord);
            previousChord = chord;
        }
    });

    return result;
}