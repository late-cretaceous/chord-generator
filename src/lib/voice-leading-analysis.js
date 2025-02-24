// lib/voice-leading-analysis.js
import { NOTES, pitchToMidi } from './core';
import { getMelodicState, updateMelodyState } from './melodic-state';

/**
 * Detects parallel perfect intervals (fifths and octaves) between two chords
 * @param {Array} prevChord - Previous chord notes
 * @param {Array} currChord - Current chord notes
 * @returns {Object} Information about detected parallel intervals
 */
export function detectParallelPerfectIntervals(prevChord, currChord) {
    if (!prevChord || !currChord || prevChord.length < 2 || currChord.length < 2) {
        return { detected: false };
    }
    
    const results = {
        detected: false,
        parallelFifths: [],
        parallelOctaves: []
    };
    
    // Convert notes to MIDI numbers for easier interval calculation
    const prevMidi = prevChord.map(note => {
        const pitch = note.replace(/[0-9]/, '');
        const octave = parseInt(note.slice(-1));
        return pitchToMidi(pitch, octave);
    });
    
    const currMidi = currChord.map(note => {
        const pitch = note.replace(/[0-9]/, '');
        const octave = parseInt(note.slice(-1));
        return pitchToMidi(pitch, octave);
    });
    
    // Check all voice pairs for parallel perfect intervals
    for (let i = 0; i < prevMidi.length - 1; i++) {
        for (let j = i + 1; j < prevMidi.length; j++) {
            // Calculate intervals between voices in both chords
            const prevInterval = Math.abs(prevMidi[i] - prevMidi[j]) % 12;
            const currInterval = Math.abs(currMidi[i] - currMidi[j]) % 12;
            
            // Check if both intervals are perfect fifths or octaves
            const isPerfectFifth = (prevInterval === 7 && currInterval === 7);
            const isPerfectOctave = (prevInterval === 0 && currInterval === 0);
            
            // Check if voices move in same direction (parallel motion)
            const prevDirection = Math.sign(prevMidi[i] - prevMidi[j]);
            const currDirection = Math.sign(currMidi[i] - currMidi[j]);
            const isParallelMotion = prevDirection === currDirection && prevDirection !== 0;
            
            // If parallel perfect interval detected, record it
            if (isParallelMotion) {
                if (isPerfectFifth) {
                    results.detected = true;
                    results.parallelFifths.push([i, j]);
                } else if (isPerfectOctave) {
                    results.detected = true;
                    results.parallelOctaves.push([i, j]);
                }
            }
        }
    }
    
    return results;
}

/**
 * Analyzes second inversions to apply appropriate rules
 * @param {Object} chord - Chord object to analyze
 * @param {Object} nextChord - Next chord in progression (if available)
 * @param {Object} prevChord - Previous chord in progression (if available)
 * @returns {Object} Context information for the second inversion
 */
export function analyzeSecondInversion(chord, nextChord, prevChord) {
    if (!chord || !chord.notes || chord.notes.length < 3) {
        return { isSecondInversion: false };
    }
    
    // Check if this is a triad in second inversion (fifth in bass)
    const rootNoteName = chord.root;
    const bassNoteName = chord.bass.replace(/[0-9]/, '');
    
    // Calculate the interval between root and bass
    const rootIndex = NOTES.indexOf(rootNoteName);
    const bassIndex = NOTES.indexOf(bassNoteName);
    if (rootIndex === -1 || bassIndex === -1) {
        return { isSecondInversion: false };
    }
    
    // Check if the bass is a perfect fifth above the root (or perfect fourth below)
    const interval = (bassIndex - rootIndex + 12) % 12;
    const isSecondInversion = interval === 7; // Perfect fifth
    
    if (!isSecondInversion) {
        return { isSecondInversion: false };
    }
    
    // Analyze the context to categorize the second inversion
    const result = {
        isSecondInversion: true,
        isCadential: false,
        isPassing: false,
        isPedal: false
    };
    
    // Check for cadential 6/4 (precedes dominant chord)
    if (nextChord) {
        const nextRoot = nextChord.root;
        // In a given key, if this chord is I6/4 and next is V, it's cadential
        // This is a simplification - ideally we'd check against the key context too
        const fifthOfRoot = NOTES[(rootIndex + 7) % 12];
        if (nextRoot === fifthOfRoot) {
            result.isCadential = true;
        }
    }
    
    // Check for passing 6/4 (same chord in different positions before and after)
    if (prevChord && nextChord) {
        if (prevChord.root === nextChord.root && 
            prevChord.quality === nextChord.quality) {
            result.isPassing = true;
        }
    }
    
    // Check for pedal 6/4 (bass stays the same across multiple chords)
    if (prevChord) {
        const prevBass = prevChord.bass.replace(/[0-9]/, '');
        if (prevBass === bassNoteName) {
            result.isPedal = true;
        }
    }
    
    return result;
}

/**
 * Get inversion bias score based on chord position
 * @param {number} inversion - Inversion number (0 = root, 1 = first, etc.)
 * @param {number} chordIndex - Position in progression
 * @param {number} progressionLength - Total length of progression
 * @returns {number} Bias score (positive = discourage, negative = encourage)
 */
export function getInversionBias(inversion, chordIndex, progressionLength) {
    // Basic biases for inversions
    const baseBiases = {
        0: 0, // No bias for root position
        1: -0.2, // Slightly favor first inversion
        2: 0.1, // Neutral for second inversion
        3: 0.3 // Less favorable for third inversion (if it exists)
    };
    
    let bias = baseBiases[inversion] || 0;
    
    // Beginning: favor root position
    if (chordIndex === 0) {
        bias += inversion * 0.5;
    }
    
    // Ending: favor root position
    if (chordIndex === progressionLength - 1) {
        bias += inversion * 0.8;
    }
    
    // For penultimate chord (second to last), favor first inversion slightly
    if (chordIndex === progressionLength - 2 && inversion === 1) {
        bias -= 0.3;
    }
    
    return bias;
}

/**
 * Calculates voice leading score between two chord voicings
 * Incorporates parallel interval detection, second inversion analysis,
 * and melodic contour considerations
 * 
 * @param {Array} previousChord - Previous chord notes array
 * @param {Array} currentChord - Current chord notes array
 * @param {number} progressionLength - Total progression length
 * @param {number} chordIndex - Current chord index in progression
 * @param {Object} prevChordObj - Previous chord object
 * @param {Object} nextChordObj - Next chord object (if available)
 * @returns {number} Voice leading score (lower is better)
 */
export function calculateVoiceLeadingScore(
    previousChord, 
    currentChord, 
    progressionLength, 
    chordIndex, 
    prevChordObj, 
    nextChordObj
) {
    if (!previousChord || !currentChord || !previousChord.length || !currentChord.length) {
        return Infinity;
    }

    let totalScore = 0;
    const minVoices = Math.min(previousChord.length, currentChord.length);

    // Process bass differently
    const prevBassMidi = pitchToMidi(previousChord[0].replace(/[0-9]/, ''), parseInt(previousChord[0].slice(-1)));
    const currBassMidi = pitchToMidi(currentChord[0].replace(/[0-9]/, ''), parseInt(currentChord[0].slice(-1)));
    const bassDistance = Math.abs(currBassMidi - prevBassMidi);
    
    // Bass movement gets 2x weight - we want smooth bass
    totalScore += bassDistance * 2;

    // Check for parallel perfect intervals
    const parallelIntervals = detectParallelPerfectIntervals(previousChord, currentChord);
    if (parallelIntervals.detected) {
        // Heavily penalize parallel fifths and octaves, especially in outer voices
        const outerVoicesParallel = parallelIntervals.parallelFifths.some(pair => 
            pair.includes(0) && pair.includes(minVoices - 1)) || 
            parallelIntervals.parallelOctaves.some(pair => 
            pair.includes(0) && pair.includes(minVoices - 1));
        
        // Outer voice parallels are more obvious to the ear
        if (outerVoicesParallel) {
            totalScore += 12; // Severe penalty
        } else {
            // Inner voice parallels less severe but still penalized
            const perfectFifthPenalty = parallelIntervals.parallelFifths.length * 6;
            const perfectOctavePenalty = parallelIntervals.parallelOctaves.length * 8;
            totalScore += perfectFifthPenalty + perfectOctavePenalty;
        }
    }
    
    // Analyze and handle second inversions
    if (chordIndex !== undefined && prevChordObj && currentChord.length >= 3) {
        // Create a temporary chord object for analysis
        const tempChord = {
            root: currentChord[currentChord.length - 3].replace(/[0-9]/, ''),
            quality: '',
            bass: currentChord[0],
            notes: currentChord
        };
        
        const secondInversionAnalysis = analyzeSecondInversion(
            tempChord, 
            nextChordObj, 
            prevChordObj
        );
        
        if (secondInversionAnalysis.isSecondInversion) {
            // Apply context-specific handling for second inversions
            if (secondInversionAnalysis.isCadential) {
                // Cadential 6/4 is good before dominant chords
                totalScore -= 3; // Encourage this usage
            } else if (secondInversionAnalysis.isPassing || secondInversionAnalysis.isPedal) {
                // Passing and pedal 6/4 are acceptable
                totalScore -= 1; // Slight encouragement
            } else {
                // Penalize second inversions used in other contexts
                totalScore += 6; // Discourage inappropriate usage
            }
        }
    }

    // Handle inner voices
    for (let i = 1; i < minVoices - 1; i++) {
        const prevMidi = pitchToMidi(previousChord[i].replace(/[0-9]/, ''), parseInt(previousChord[i].slice(-1)));
        const currMidi = pitchToMidi(currentChord[i].replace(/[0-9]/, ''), parseInt(currentChord[i].slice(-1)));
        
        // We care about smoothness in inner voices, but less so than bass or melody
        const distance = Math.abs(currMidi - prevMidi);
        totalScore += distance * 0.8; // Less weight for inner voices
        
        // Heavily penalize voice crossing or large leaps in inner voices
        if (distance > 5) {
            totalScore += (distance - 5) * 1.5;
        }
    }

    // Handle melody (highest note) separately
    if (minVoices > 1) {
        const melodyIndex = minVoices - 1;
        const prevMelodyMidi = pitchToMidi(
            previousChord[melodyIndex].replace(/[0-9]/, ''), 
            parseInt(previousChord[melodyIndex].slice(-1))
        );
        const currMelodyMidi = pitchToMidi(
            currentChord[melodyIndex].replace(/[0-9]/, ''), 
            parseInt(currentChord[melodyIndex].slice(-1))
        );
        
        // Use the melodic-state module to handle melodic contour
        const melodyScore = updateMelodyState(currMelodyMidi, progressionLength);
        totalScore += melodyScore.totalAdjustment;
    }

    return totalScore;
}