import { NOTES, pitchToMidi, midiToPitch, parseChordSymbol } from './core';

/**
 * Gets all possible inversions for a chord
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
    console.log('Inversions for', chord.notes, ':', inversions);
    return inversions;
}

/**
 * NEW: Track melodic direction to encourage interesting contours
 */
const melodicState = {
    direction: 0, // -1 = descending, 0 = neutral, 1 = ascending
    directionSteps: 0, // How many steps we've moved in this direction
    lastMelodyNote: null, // Last melody note in MIDI number
    phrasePosition: 0, // Position in overall phrase
    leapOccurred: false, // Whether a leap just occurred (for resolution)
    leapSize: 0 // Size of last leap
};

/**
 * Reset melodic state at the start of a new progression
 */
function resetMelodicState() {
    melodicState.direction = 0;
    melodicState.directionSteps = 0;
    melodicState.lastMelodyNote = null;
    melodicState.phrasePosition = 0;
    melodicState.leapOccurred = false;
    melodicState.leapSize = 0;
}

/**
 * NEW: Detects parallel perfect intervals (fifths and octaves) between two chords
 * @param {Array} prevChord - Previous chord notes
 * @param {Array} currChord - Current chord notes
 * @returns {Object} Information about detected parallel intervals
 */
function detectParallelPerfectIntervals(prevChord, currChord) {
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
 * NEW: Detects and categorizes second inversions to apply appropriate rules
 * @param {Object} chord - Chord object to analyze
 * @param {Object} nextChord - Next chord in progression (if available)
 * @param {Object} prevChord - Previous chord in progression (if available)
 * @returns {Object} Context information for the second inversion
 */
function analyzeSecondInversion(chord, nextChord, prevChord) {
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
 * IMPROVED: Calculate voice leading distance with enhanced melodic handling
 * and detection of parallel perfect intervals and second inversion handling
 */
function calculateVoiceLeadingScore(previousChord, currentChord, progressionLength, chordIndex, prevChordObj, nextChordObj) {
    if (!previousChord || !currentChord || !previousChord.length || !currentChord.length) {
        return Infinity;
    }

    let totalScore = 0;
    const minVoices = Math.min(previousChord.length, currentChord.length);

    // Process bass differently
    const prevBassMidi = pitchToMidi(previousChord[0].replace(/[0-9]/, ''), parseInt(previousChord[0].slice(-1)));
    const currBassMidi = pitchToMidi(currentChord[0].replace(/[0-9]/, ''), parseInt(currentChord[0].slice(-1)));
    const bassDistance = Math.abs(currBassMidi - prevBassMidi);
    
    // Bass movement gets 2x weight - we still want smooth bass
    totalScore += bassDistance * 2;

    // NEW: Check for parallel perfect intervals
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
    
    // NEW: Analyze and handle second inversions
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

    // Handle melody (highest note) differently
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
        
        // Calculate melodic interval and direction
        const melodyDistance = Math.abs(currMelodyMidi - prevMelodyMidi);
        const melodyDirection = Math.sign(currMelodyMidi - prevMelodyMidi); // -1, 0, or 1
        
        // First note doesn't affect scoring
        if (melodicState.lastMelodyNote !== null) {
            // Update melody state for future decisions
            melodicState.phrasePosition++;
            
            // Check for leap and resolution
            const isLeap = melodyDistance > 2; // More than a whole step
            
            if (isLeap) {
                melodicState.leapOccurred = true;
                melodicState.leapSize = melodyDistance;
                // Penalize very large leaps
                if (melodyDistance > 7) {
                    totalScore += (melodyDistance - 7) * 3;
                }
            } else if (melodicState.leapOccurred) {
                // If previous move was a leap, reward steps in opposite direction (resolution)
                if (melodyDirection !== melodicState.direction && melodyDistance <= 2) {
                    totalScore -= 2; // Reward for proper resolution
                } else {
                    // Penalize failure to resolve leap properly
                    totalScore += 3;
                }
                melodicState.leapOccurred = false;
            }
            
            // Track melodic direction for contour shaping
            if (melodyDirection !== 0) {
                if (melodyDirection === melodicState.direction) {
                    melodicState.directionSteps++;
                    
                    // After 3 steps in same direction, encourage change
                    if (melodicState.directionSteps > 3) {
                        totalScore += melodicState.directionSteps - 3;
                    }
                } else {
                    // Reward change of direction after consistent movement
                    if (melodicState.directionSteps > 1) {
                        totalScore -= 1;
                    }
                    melodicState.direction = melodyDirection;
                    melodicState.directionSteps = 1;
                }
            }
            
            // Create climax points at structural positions
            const isNearEnd = melodicState.phrasePosition >= progressionLength - 2;
            const isHighNote = currMelodyMidi >= melodicState.lastMelodyNote + 3;
            
            if (isNearEnd && !isHighNote) {
                // Encourage cadential movement
                totalScore += 1.5;
            }
            
            // Generally encourage movement in melody vs static melody
            if (melodyDistance === 0) {
                totalScore += 1;
            }
        }
        
        melodicState.lastMelodyNote = currMelodyMidi;
    }

    return totalScore;
}

/**
 * UPDATED: Bias inversions to favor interesting choices
 */
function getInversionBias(inversion, chordIndex, progressionLength) {
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
 * IMPROVED: Select the best inversion based on enhanced melodic criteria
 */
function selectBestInversion(
    inversions, 
    previousChordNotes, 
    progressionLength, 
    chordIndex, 
    prevChordObj, 
    nextChordObj
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
        
        console.log('Inversion', inv.notes, 'Score:', score);
        return { ...inv, score };
    });

    // Sort by score (lower is better)
    return weightedInversions.sort((a, b) => a.score - b.score)[0];
}

/**
 * UPDATED: Assess whether an inversion would improve the progression
 */
function assessInversionBenefit(
    currentChord, 
    previousChord, 
    progressionLength, 
    chordIndex,
    progression
) {
    if (!previousChord || !previousChord.notes.length) {
        console.log('No previous notes, skipping inversion');
        return { shouldInvert: false, bestInversion: null };
    }

    const inversions = getInversions(currentChord);
    if (!inversions.length) {
        console.log('No inversions available');
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
        nextChord
    );
    
    const bestScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        bestInversion.notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    );

    console.log(`Root Score: ${rootScore}, Best Score: ${bestScore}, Improvement: ${rootScore - bestScore}`);

    // Determine if inversion is worthwhile (lower threshold makes more inversions)
    const improvementThreshold = 0.8;
    const shouldInvert = (rootScore - bestScore) > improvementThreshold;

    return { shouldInvert, bestInversion };
}

/**
 * Format chord symbol with inversion notation
 */
export function formatInversionSymbol(root, quality, bassNote) {
    if (!bassNote || bassNote.startsWith(root)) return root + quality;
    return `${root}${quality}/${bassNote.replace(/[0-9]/, '')}`;
}

/**
 * IMPROVED: Apply inversions to a progression with enhanced melodic awareness
 * and detection of parallel perfect intervals
 */
export function applyProgressionInversions(progression) {
    if (!progression || progression.length === 0) return progression;

    const result = [];
    let previousChord = null;
    
    // Reset melodic state at the start of a new progression
    resetMelodicState();

    progression.forEach((chord, chordIndex) => {
        const { shouldInvert, bestInversion } = assessInversionBenefit(
            chord, 
            previousChord, 
            progression.length, 
            chordIndex,
            progression
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