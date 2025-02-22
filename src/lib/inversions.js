import { NOTES, CHORD_INTERVALS } from './core';

/**
 * Gets all possible inversions for a chord
 * @param {string} rootNote - Root note of the chord
 * @param {string} chordType - Type of chord (e.g., 'major', 'minor')
 * @returns {Array} Array of possible inversions with their notes and bass note
 */
export function getChordInversions(rootNote, chordType) {
    // Get the notes of the chord
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) {
        return [{ inversion: 0, bassNote: rootNote, notes: [rootNote] }];
    }
    
    const rootIndex = NOTES.indexOf(rootNote);
    if (rootIndex === -1) {
        return [{ inversion: 0, bassNote: rootNote, notes: [rootNote] }];
    }
    
    // Get all notes in the chord
    const notes = intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
    
    // Generate inversions
    const inversions = [];
    
    // Root position (0th inversion)
    inversions.push({
        inversion: 0,
        bassNote: notes[0],
        notes: [...notes]
    });
    
    // Other inversions
    for (let i = 1; i < notes.length && i <= 3; i++) {
        // Only support up to 3rd inversion
        inversions.push({
            inversion: i,
            bassNote: notes[i], // Bass note is the inversion note
            notes: [...notes]
        });
    }
    
    return inversions;
}

/**
 * Calculates voice leading distance between two sets of notes
 * @param {Array} previousNotes - Notes of the previous chord
 * @param {Array} currentNotes - Notes of the current chord
 * @returns {number} Total voice leading distance (lower is better)
 */
function calculateVoiceLeadingDistance(previousNotes, currentNotes) {
    if (!previousNotes || !currentNotes || !previousNotes.length || !currentNotes.length) {
        return Infinity;
    }

    // We'll assign different weights to different inversions to avoid ties
    // Root position (0) has a slight penalty, first inversion has advantage,
    // second inversion has more penalty, and third inversion has most penalty
    const inversionOffset = {
        0: 0.05,  // Slight penalty for root position (good for cadences)
        1: -0.05, // Slight advantage for first inversion (good for voice leading)
        2: 0.1,   // Moderate penalty for second inversion (less common)
        3: 0.2    // High penalty for third inversion (rare, unstable)
    };
    
    // Create a map for easy lookup of note indices
    const noteIndices = {};
    NOTES.forEach((note, index) => {
        noteIndices[note] = index;
    });
    
    // For each previous note, find the closest current note
    let totalDistance = 0;
    previousNotes.forEach(prevNote => {
        if (!noteIndices.hasOwnProperty(prevNote)) return;
        
        const prevIndex = noteIndices[prevNote];
        
        // Find the closest note in current chord
        let minDistance = Infinity;
        currentNotes.forEach(currNote => {
            if (!noteIndices.hasOwnProperty(currNote)) return;
            
            const currIndex = noteIndices[currNote];
            
            // Calculate circular distance (consider both directions around the octave)
            let distance = Math.abs(currIndex - prevIndex);
            distance = Math.min(distance, 12 - distance);
            
            if (distance < minDistance) {
                minDistance = distance;
            }
        });
        
        totalDistance += minDistance;
    });
    
    return totalDistance;
}

/**
 * Selects the best inversion based on voice leading from previous chord
 * @param {Array} currentInversions - All possible inversions of the current chord
 * @param {Array} previousNotes - Notes of the previous chord
 * @param {number} inversionNumber - The inversion number (for weighted selection)
 * @returns {Object} The best inversion based on voice leading
 */
export function selectBestInversion(currentInversions, previousNotes, inversionNumber = null) {
    if (!previousNotes || !previousNotes.length || !currentInversions.length) {
        return currentInversions[0]; // Return root position if no previous chord
    }
    
    // Calculate voice leading distances for each inversion
    const inversionsWithDistances = currentInversions.map(inversion => {
        // Calculate base voice leading distance
        let distance = calculateVoiceLeadingDistance(previousNotes, inversion.notes);
        
        // Apply slight biases to avoid ties
        // First inversion has advantage, second and third have penalties
        distance += (inversion.inversion === 1) ? -0.1 : 
                   (inversion.inversion === 2) ? 0.1 : 
                   (inversion.inversion === 3) ? 0.2 : 0;
                   
        return {
            ...inversion,
            voiceLeadingDistance: distance
        };
    });
    
    // Sort by voice leading distance (ascending - lower is better)
    inversionsWithDistances.sort((a, b) => a.voiceLeadingDistance - b.voiceLeadingDistance);
    
    // If we specified a particular inversion, use it if available
    if (inversionNumber !== null && inversionNumber < currentInversions.length) {
        const requestedInversion = currentInversions.find(inv => inv.inversion === inversionNumber);
        if (requestedInversion) return requestedInversion;
    }
    
    // Return the inversion with the best voice leading
    return inversionsWithDistances[0];
}

/**
 * Gets chord symbol with inversion
 * @param {string} rootNote - Root note of the chord
 * @param {string} quality - Chord quality ('major', 'minor', etc.)
 * @param {number} inversion - Inversion number (0, 1, 2, 3)
 * @param {Array} notes - All notes in the chord
 * @returns {string} Chord symbol with inversion notation
 */
export function getInversionSymbol(rootNote, quality, inversion, notes) {
    if (inversion === 0 || !notes || notes.length <= inversion) {
        // Handle basic suffix directly for reliability
        const suffix = quality === 'major' ? '' : 
                      quality === 'minor' ? 'm' : 
                      quality === 'diminished' ? 'dim' : 
                      quality === 'augmented' ? 'aug' : 
                      quality === 'dominant7' ? '7' : 
                      quality === 'major7' ? 'maj7' : 
                      quality === 'minor7' ? 'm7' : 
                      quality === 'diminished7' ? 'dim7' : quality;
        
        return rootNote + suffix;
    }
    
    // For the inversion, directly apply the suffix instead of using helpers
    const suffix = quality === 'major' ? '' : 
                  quality === 'minor' ? 'm' : 
                  quality === 'diminished' ? 'dim' : 
                  quality === 'augmented' ? 'aug' : 
                  quality === 'dominant7' ? '7' : 
                  quality === 'major7' ? 'maj7' : 
                  quality === 'minor7' ? 'm7' : 
                  quality === 'diminished7' ? 'dim7' : quality;
                  
    const rootWithQuality = rootNote + suffix;
    
    // The chord symbol with inversion notation (e.g., C/E for C major first inversion)
    return rootWithQuality + '/' + notes[inversion];
}

/**
 * Makes a decision whether to use an inversion based on context
 * @param {number} position - Position in the progression (0-based)
 * @param {number} progressionLength - Total length of the progression
 * @returns {boolean} True if an inversion should be considered
 */
export function shouldUseInversion(position, progressionLength) {
    if (position === 0) return Math.random() < 0.15; // 15% chance for first chord - typically in root position
    if (position === progressionLength - 1) return Math.random() < 0.25; // 25% chance for last chord - cadential chords often in root
    
    // More balanced probability for middle chords
    return Math.random() < 0.55; // 55% chance for middle chords - common but not overwhelming
}

/**
 * Processes a chord progression to apply inversions for better voice leading
 * @param {Array} progression - Array of chord symbols
 * @returns {Array} Progression with inversions applied where appropriate
 */
export function applyProgressionInversions(progression) {
    if (!progression || progression.length === 0) return progression;
    
    const result = [];
    let previousNotes = null;
    
    // Add a slight randomization to inversion selection
    // to avoid predictable patterns
    const getRandomInversion = () => {
        const rand = Math.random();
        // Distribution: 40% first inversion, 10% second inversion, 50% best voice leading
        if (rand < 0.4) return 1; // First inversion
        if (rand < 0.5) return 2; // Second inversion
        return null; // Let voice leading algorithm decide
    };
    
    progression.forEach((chordSymbol, index) => {
        // Parse the chord
        const rootPattern = /^([A-G][#]?)([a-z0-9]*)$/;
        const rootMatch = chordSymbol.match(rootPattern);
        
        if (!rootMatch) {
            result.push(chordSymbol); // Can't parse, keep as is
            return;
        }
        
        const rootNote = rootMatch[0];
        let chordType = chordSymbol.slice(rootNote.length);
        
        // Map chord symbols to quality
        const chordTypeMap = {
            '': 'major',
            'm': 'minor',
            'min': 'minor',
            'dim': 'diminished',
            'aug': 'augmented',
            '7': 'dominant7',
            'maj7': 'major7',
            'm7': 'minor7',
            'dim7': 'diminished7'
        };
        
        const quality = chordTypeMap[chordType] || 'major';
        
        // Decide whether to consider an inversion
        if (!shouldUseInversion(index, progression.length)) {
            result.push(chordSymbol); // Keep in root position
            
            // Still update previousNotes for next chord
            const intervals = CHORD_INTERVALS[quality];
            if (intervals) {
                const rootIndex = NOTES.indexOf(rootNote);
                previousNotes = intervals.map(interval => {
                    const noteIndex = (rootIndex + interval) % 12;
                    return NOTES[noteIndex];
                });
            }
            return;
        }
        
        // Get all possible inversions
        const inversions = getChordInversions(rootNote, quality);
        
        // Sometimes force specific inversions for variety
        const forcedInversion = getRandomInversion();
        
        // Select best inversion
        const bestInversion = selectBestInversion(inversions, previousNotes, forcedInversion);
        
        // Update previous notes for next iteration
        previousNotes = bestInversion.notes;
        
        // Add the chord with inversion to the result
        if (bestInversion.inversion === 0) {
            result.push(chordSymbol); // Root position, no change needed
        } else {
            const inversionSymbol = getInversionSymbol(
                rootNote,
                quality,
                bestInversion.inversion,
                bestInversion.notes
            );
            result.push(inversionSymbol);
        }
    });
    
    return result;
}