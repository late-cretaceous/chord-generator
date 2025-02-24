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
 * Update melody state based on new melody note
 * @param {number} melodyMidi - MIDI pitch value of the melody note
 * @param {number} progressionLength - Total length of progression
 * @returns {Object} Score adjustments based on melodic analysis
 */
export function updateMelodyState(melodyMidi, progressionLength) {
    const scoreAdjustments = {
        totalAdjustment: 0,
        leapPenalty: 0,
        leapResolutionReward: 0,
        directionChangeReward: 0,
        staticMelodyPenalty: 0,
        cadentialAdjustment: 0
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
    
    // Create climax points at structural positions
    const isNearEnd = melodicState.phrasePosition >= progressionLength - 2;
    const isHighNote = melodyMidi >= melodicState.lastMelodyNote + 3;
    
    if (isNearEnd && !isHighNote) {
        // Encourage cadential movement
        scoreAdjustments.cadentialAdjustment = 1.5;
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