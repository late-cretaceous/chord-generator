// lib/voice-leading-analysis.js
import { NOTES, pitchToMidi } from '../core';
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
 * Analyzes cadential patterns at the end of a progression
 * @param {Object} currentChord - Current chord object
 * @param {Object} nextChord - Next chord in progression (if available)
 * @param {number} chordIndex - Position in the progression
 * @param {number} progressionLength - Total length of progression
 * @returns {Object} Information about the cadential pattern
 */
export function analyzeCadentialPattern(currentChord, nextChord, chordIndex, progressionLength) {
    if (!currentChord || !nextChord) {
        return { isCadential: false };
    }
    
    // Check if we're near the end of the progression
    const isNearEnd = (chordIndex >= progressionLength - 2);
    if (!isNearEnd) {
        return { isCadential: false };
    }
    
    const result = {
        isCadential: false,
        isAuthenticCadence: false,
        isPerfectAuthenticCadence: false
    };
    
    // Get the root notes without octave information
    const currentRoot = currentChord.root ? currentChord.root.replace(/[0-9]/, '') : '';
    const nextRoot = nextChord.root ? nextChord.root.replace(/[0-9]/, '') : '';
    
    // Check if this is a potential authentic cadence (V-I)
    if (!currentRoot || !nextRoot) return result;
    
    const currentRootIndex = NOTES.indexOf(currentRoot);
    const nextRootIndex = NOTES.indexOf(nextRoot);
    
    if (currentRootIndex === -1 || nextRootIndex === -1) return result;
    
    // V-I relationship: if the current root is a perfect fifth above the next root
    const isFifthRelationship = (nextRootIndex - currentRootIndex + 12) % 12 === 7;
    
    if (isFifthRelationship) {
        result.isCadential = true;
        
        // It's an authentic cadence if the next chord is in root position
        const nextBassNote = nextChord.bass ? nextChord.bass.replace(/[0-9]/, '') : '';
        if (nextBassNote === nextRoot) {
            result.isAuthenticCadence = true;
            
            // For perfect authentic cadence, the melody (highest note) should be the tonic
            if (nextChord.notes && nextChord.notes.length > 0) {
                const highestNote = nextChord.notes[nextChord.notes.length - 1].replace(/[0-9]/, '');
                if (highestNote === nextRoot) {
                    result.isPerfectAuthenticCadence = true;
                }
            }
        }
    }
    
    return result;
}

/**
 * Detects and analyzes leading tone resolution
 * @param {Array} prevChord - Previous chord notes
 * @param {Array} currChord - Current chord notes
 * @param {Object} prevChordObj - Previous chord object
 * @param {Object} currChordObj - Current chord object
 * @returns {Object} Information about leading tone resolution
 */
export function analyzeLeadingToneResolution(prevChord, currChord, prevChordObj, currChordObj) {
    if (!prevChord || !currChord || !prevChordObj || !currChordObj) {
        return { hasLeadingTone: false };
    }
    
    const result = {
        hasLeadingTone: false,
        resolvesCorrectly: false,
        leadingToneVoice: -1
    };
    
    // Get roots without octaves
    const prevRoot = prevChordObj.root ? prevChordObj.root.replace(/[0-9]/, '') : '';
    const currRoot = currChordObj.root ? currChordObj.root.replace(/[0-9]/, '') : '';
    
    if (!prevRoot || !currRoot) return result;
    
    const prevRootIndex = NOTES.indexOf(prevRoot);
    const currRootIndex = NOTES.indexOf(currRoot);
    
    if (prevRootIndex === -1 || currRootIndex === -1) return result;
    
    // Check if previous chord is dominant (fifth above tonic)
    // and current chord is tonic
    const isFifthRelationship = (currRootIndex - prevRootIndex + 12) % 12 === 7;
    
    if (!isFifthRelationship) return result;
    
    // Calculate the leading tone (seventh degree of the scale)
    // It's a semitone below the tonic
    const leadingToneIndex = (currRootIndex - 1 + 12) % 12;
    const leadingTone = NOTES[leadingToneIndex];
    
    // Look for the leading tone in the previous chord
    for (let i = 0; i < prevChord.length; i++) {
        const noteName = prevChord[i].replace(/[0-9]/, '');
        if (noteName === leadingTone) {
            result.hasLeadingTone = true;
            result.leadingToneVoice = i;
            
            // Check if the leading tone resolves to the tonic
            if (i < currChord.length) {
                const resolutionNote = currChord[i].replace(/[0-9]/, '');
                if (resolutionNote === currRoot) {
                    result.resolvesCorrectly = true;
                }
            }
            
            break;
        }
    }
    
    return result;
}

/**
 * Optimizes the placement of leading tones in a chord for better resolution
 * @param {Object} chord - Chord object containing notes array
 * @param {string} targetTonic - Target tonic note (e.g., 'C')
 * @returns {Object} Modified chord object with properly placed leading tone
 */
export function optimizeLeadingToneVoicing(chord, targetTonic) {
    if (!chord || !chord.notes || chord.notes.length < 3 || !targetTonic) {
        return chord;
    }
    
    // Find the leading tone (semitone below targetTonic)
    const tonicIndex = NOTES.indexOf(targetTonic);
    if (tonicIndex === -1) return chord;
    
    const leadingToneIndex = (tonicIndex - 1 + 12) % 12;
    const leadingTone = NOTES[leadingToneIndex];
    
    // Check if chord contains the leading tone
    const leadingToneIndices = [];
    
    chord.notes.forEach((note, index) => {
        const noteName = note.replace(/[0-9]/, '');
        if (noteName === leadingTone) {
            leadingToneIndices.push(index);
        }
    });
    
    // If no leading tone is found, return the original chord
    if (leadingToneIndices.length === 0) {
        return chord;
    }
    
    // Get a copy of the chord to modify
    const optimizedChord = {
        ...chord,
        notes: [...chord.notes]
    };
    
    // If the leading tone is in an inner voice, try to move it to the soprano
    if (leadingToneIndices.length === 1 && 
        leadingToneIndices[0] < chord.notes.length - 1 &&
        leadingToneIndices[0] > 0) {
        
        // Get the current octave of the leading tone
        const ltOctave = parseInt(chord.notes[leadingToneIndices[0]].slice(-1));
        
        // Get the soprano note
        const sopranoIndex = chord.notes.length - 1;
        const sopranoNote = chord.notes[sopranoIndex].replace(/[0-9]/, '');
        const sopranoOctave = parseInt(chord.notes[sopranoIndex].slice(-1));
        
        // Check if the soprano is not already a leading tone
        if (sopranoNote !== leadingTone) {
            // Replace soprano with leading tone in appropriate octave
            optimizedChord.notes[sopranoIndex] = `${leadingTone}${sopranoOctave}`;
            
            // Move the original soprano note to the inner voice
            optimizedChord.notes[leadingToneIndices[0]] = `${sopranoNote}${ltOctave}`;
        }
    }
    
    return optimizedChord;
}

/**
 * Checks if a chord contains the leading tone of a key
 * @param {Object} chord - Chord object with notes array
 * @param {string} key - Key center (e.g., 'C')
 * @returns {boolean} Whether the chord contains the leading tone
 */
export function hasLeadingTone(chord, key) {
    if (!chord || !chord.notes || !key) return false;
    
    // Find the leading tone (semitone below key)
    const keyIndex = NOTES.indexOf(key);
    if (keyIndex === -1) return false;
    
    const leadingToneIndex = (keyIndex - 1 + 12) % 12;
    const leadingTone = NOTES[leadingToneIndex];
    
    // Check if any note in the chord is the leading tone
    return chord.notes.some(note => {
        const noteName = note.replace(/[0-9]/, '');
        return noteName === leadingTone;
    });
}

/**
 * Calculates voice leading score between two chord voicings
 * Incorporates parallel interval detection, second inversion analysis,
 * cadential patterns, and leading tone treatment
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
            root: prevChordObj.root,  // Use previous chord's root
            quality: prevChordObj.quality,
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

    // Check cadential patterns
    if (chordIndex !== undefined && nextChordObj && chordIndex < progressionLength - 1) {
        // Create a temporary current chord object for analysis
        const tempCurrentChord = {
            root: prevChordObj.root,  // Use the actual chord root
            quality: prevChordObj.quality,
            bass: currentChord[0],
            notes: currentChord
        };
        
        const cadentialAnalysis = analyzeCadentialPattern(
            tempCurrentChord,
            nextChordObj,
            chordIndex,
            progressionLength
        );
        
        if (cadentialAnalysis.isCadential) {
            // Encourage authentic cadences at the end
            if (cadentialAnalysis.isAuthenticCadence) {
                totalScore -= 4; // Reward for authentic cadence
                
                // Perfect authentic cadences are even better
                if (cadentialAnalysis.isPerfectAuthenticCadence) {
                    totalScore -= 3; // Additional reward
                }
            }
        }
    }
    
    // Check leading tone resolution
    if (prevChordObj && currentChord.length >= 3) {
        // Create a temporary current chord object for analysis
        const tempCurrentChord = {
            root: prevChordObj.root,  // Use the actual chord root
            quality: prevChordObj.quality,
            bass: currentChord[0],
            notes: currentChord
        };
        
        const leadingToneAnalysis = analyzeLeadingToneResolution(
            previousChord,
            currentChord,
            prevChordObj,
            tempCurrentChord
        );
        
        if (leadingToneAnalysis.hasLeadingTone) {
            if (leadingToneAnalysis.resolvesCorrectly) {
                totalScore -= 4; // Strong reward for proper leading tone resolution
            } else {
                totalScore += 6; // Strong penalty for improper leading tone handling
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
        
        // Calculate tonic MIDI for leading tone analysis
        let tonicMidi = null;
        if (nextChordObj && nextChordObj.root) {
            const tonicPitch = nextChordObj.root.replace(/[0-9]/, '');
            const tonicOctave = parseInt(nextChordObj.bass ? nextChordObj.bass.slice(-1) : '3');
            tonicMidi = pitchToMidi(tonicPitch, tonicOctave);
        }
        
        // Use the melodic-state module to handle melodic contour
        const melodyScore = updateMelodyState(currMelodyMidi, progressionLength, tonicMidi);
        totalScore += melodyScore.totalAdjustment;
    }

    return totalScore;
}