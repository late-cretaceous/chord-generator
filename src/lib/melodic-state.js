// lib/melodic-state.js

/**
 * Manages melodic state and contour during voice leading optimization
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
export function resetMelodicState() {
    melodicState.direction = 0;
    melodicState.directionSteps = 0;
    melodicState.lastMelodyNote = null;
    melodicState.phrasePosition = 0;
    melodicState.leapOccurred = false;
    melodicState.leapSize = 0;
}

/**
 * Get the current melodic state (for voice leading calculations)
 * @returns {Object} The current melodic state object
 */
export function getMelodicState() {
    return melodicState;
}

/**
 * Specifically analyzes and scores melody notes that are leading tones
 * @param {number} melodyMidi - MIDI pitch value of the melody note
 * @param {number} tonicMidi - MIDI pitch value of the tonic note
 * @param {number} previousMelodyMidi - MIDI pitch value of the previous melody note
 * @returns {Object} Score adjustments based on leading tone analysis
 */
function analyzeLeadingToneInMelody(melodyMidi, tonicMidi, previousMelodyMidi) {
    const scoreAdjustments = {
        leadingToneAdjustment: 0,
        totalAdjustment: 0
    };
    
    if (previousMelodyMidi === null || tonicMidi === null) {
        return scoreAdjustments;
    }
    
    // Check if previous note was a leading tone (semitone below tonic)
    const isFromLeadingTone = (tonicMidi - previousMelodyMidi) === 1;
    
    if (isFromLeadingTone) {
        // If we're coming from a leading tone, strongly prefer resolving to tonic
        if (melodyMidi === tonicMidi) {
            // Proper resolution of leading tone to tonic
            scoreAdjustments.leadingToneAdjustment = -4; // Strong reward
        } else {
            // Leading tone that doesn't resolve to tonic
            scoreAdjustments.leadingToneAdjustment = 5; // Strong penalty
        }
        
        scoreAdjustments.totalAdjustment = scoreAdjustments.leadingToneAdjustment;
    }
    
    return scoreAdjustments;
}

/**
 * Update melody state based on new melody note
 * @param {number} melodyMidi - MIDI pitch value of the melody note
 * @param {number} progressionLength - Total length of progression
 * @param {number} tonicMidi - Optional MIDI pitch value of the tonic note
 * @returns {Object} Score adjustments based on melodic analysis
 */
export function updateMelodyState(melodyMidi, progressionLength, tonicMidi = null) {
    const scoreAdjustments = {
        totalAdjustment: 0,
        leapPenalty: 0,
        leapResolutionReward: 0,
        directionChangeReward: 0,
        staticMelodyPenalty: 0,
        cadentialAdjustment: 0,
        leadingToneAdjustment: 0  // New field
    };
    
    // First note doesn't affect scoring
    if (melodicState.lastMelodyNote === null) {
        melodicState.lastMelodyNote = melodyMidi;
        return scoreAdjustments;
    }
    
    // Calculate melodic interval and direction
    const melodyDistance = Math.abs(melodyMidi - melodicState.lastMelodyNote);
    const melodyDirection = Math.sign(melodyMidi - melodicState.lastMelodyNote); // -1, 0, or 1
    
    // Update phrase position for structural decisions
    melodicState.phrasePosition++;
    
    // Check for leap and resolution
    const isLeap = melodyDistance > 2; // More than a whole step
    
    if (isLeap) {
        melodicState.leapOccurred = true;
        melodicState.leapSize = melodyDistance;
        
        // Penalize very large leaps
        if (melodyDistance > 7) {
            scoreAdjustments.leapPenalty = (melodyDistance - 7) * 3;
            scoreAdjustments.totalAdjustment += scoreAdjustments.leapPenalty;
        }
    } else if (melodicState.leapOccurred) {
        // If previous move was a leap, reward steps in opposite direction (resolution)
        if (melodyDirection !== melodicState.direction && melodyDistance <= 2) {
            scoreAdjustments.leapResolutionReward = -2; // Reward for proper resolution
            scoreAdjustments.totalAdjustment += scoreAdjustments.leapResolutionReward;
        } else {
            // Penalize failure to resolve leap properly
            scoreAdjustments.leapResolutionReward = 3; // Actually a penalty
            scoreAdjustments.totalAdjustment += scoreAdjustments.leapResolutionReward;
        }
        melodicState.leapOccurred = false;
    }
    
    // Check leading tone resolution if tonic is provided
    if (tonicMidi !== null) {
        const leadingToneAnalysis = analyzeLeadingToneInMelody(
            melodyMidi, 
            tonicMidi, 
            melodicState.lastMelodyNote
        );
        
        scoreAdjustments.leadingToneAdjustment = leadingToneAnalysis.leadingToneAdjustment;
        scoreAdjustments.totalAdjustment += leadingToneAnalysis.totalAdjustment;
    }
    
    // Track melodic direction for contour shaping
    if (melodyDirection !== 0) {
        if (melodyDirection === melodicState.direction) {
            melodicState.directionSteps++;
            
            // After 3 steps in same direction, encourage change
            if (melodicState.directionSteps > 3) {
                scoreAdjustments.directionChangeReward = melodicState.directionSteps - 3;
                scoreAdjustments.totalAdjustment += scoreAdjustments.directionChangeReward;
            }
        } else {
            // Reward change of direction after consistent movement
            if (melodicState.directionSteps > 1) {
                scoreAdjustments.directionChangeReward = -1;
                scoreAdjustments.totalAdjustment += scoreAdjustments.directionChangeReward;
            }
            melodicState.direction = melodyDirection;
            melodicState.directionSteps = 1;
        }
    }
    
    // Enhanced cadential handling for phrase endings
    const isNearEnd = melodicState.phrasePosition >= progressionLength - 2;
    const isHighNote = melodyMidi >= melodicState.lastMelodyNote + 3;
    
    if (isNearEnd) {
        if (tonicMidi !== null) {
            // At cadence points, encourage resolution to tonic or movement to scale degree 2
            const distanceToTonic = Math.abs(melodyMidi - tonicMidi);
            if (distanceToTonic === 0) {
                // Resolve to tonic at end
                scoreAdjustments.cadentialAdjustment = -3; // Strong reward
            } else if (distanceToTonic === 2) {
                // Scale degree 2 is also common at cadence points
                scoreAdjustments.cadentialAdjustment = -1.5; // Moderate reward
            } else {
                // Penalize other scale degrees at cadence
                scoreAdjustments.cadentialAdjustment = 2; // Penalty
            }
        } else {
            // Without tonic context, just encourage general cadential movement
            scoreAdjustments.cadentialAdjustment = 1.5;
        }
        
        scoreAdjustments.totalAdjustment += scoreAdjustments.cadentialAdjustment;
    }
    
    // Generally encourage movement in melody vs static melody
    if (melodyDistance === 0) {
        scoreAdjustments.staticMelodyPenalty = 1;
        scoreAdjustments.totalAdjustment += scoreAdjustments.staticMelodyPenalty;
    }
    
    // Update state for next evaluation
    melodicState.lastMelodyNote = melodyMidi;
    
    return scoreAdjustments;
}