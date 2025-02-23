// src/lib/inversions.js
import { NOTES, parseChordSymbol, getNotesFromChordSymbol } from './core';

/**
 * Determines the possible inversions for a chord
 * @param {string[]} chordNotes - Array of notes in the chord
 * @returns {Array<{inversion: number, bassNote: string, notes: string[]}>} Possible inversions
 */
export function getInversions(chordNotes) {
    if (!chordNotes || !chordNotes.length) {
        return [];
    }

    return chordNotes.map((bassNote, inversionNum) => ({
        inversion: inversionNum,
        bassNote,
        notes: [...chordNotes] // Original note order preserved
    }));
}

/**
 * Calculates voice leading distance between two chords
 * @param {string[]} previousChord - Notes of the previous chord
 * @param {string[]} currentChord - Notes of the current chord
 * @returns {number} Total voice leading distance
 */
function calculateVoiceLeadingDistance(previousChord, currentChord) {
    if (!previousChord || !currentChord || !previousChord.length || !currentChord.length) {
        return Infinity;
    }

    // Create note index map for efficient lookup
    const noteIndices = {};
    NOTES.forEach((note, index) => noteIndices[note] = index);

    let totalDistance = 0;
    previousChord.forEach(prevNote => {
        if (!noteIndices.hasOwnProperty(prevNote)) return;
        
        const prevIndex = noteIndices[prevNote];
        let minDistance = Infinity;

        currentChord.forEach(currNote => {
            if (!noteIndices.hasOwnProperty(currNote)) return;
            
            const currIndex = noteIndices[currNote];
            const distance = Math.min(
                Math.abs(currIndex - prevIndex),
                12 - Math.abs(currIndex - prevIndex)
            );
            minDistance = Math.min(minDistance, distance);
        });

        totalDistance += minDistance;
    });

    return totalDistance;
}

/**
 * Selects best inversion based on voice leading
 * @param {Array<{inversion: number, bassNote: string, notes: string[]}>} inversions - Possible inversions
 * @param {string[]} previousChordNotes - Notes of the previous chord
 * @param {Object} options - Additional options
 * @returns {Object} Best inversion based on voice leading
 */
export function selectBestInversion(inversions, previousChordNotes, options = {}) {
    if (!inversions.length) return null;
    if (!previousChordNotes || !previousChordNotes.length) return inversions[0];

    const weightedInversions = inversions.map(inv => ({
        ...inv,
        distance: calculateVoiceLeadingDistance(previousChordNotes, inv.notes) + 
                 getInversionBias(inv.inversion)
    }));

    return weightedInversions.sort((a, b) => a.distance - b.distance)[0];
}

/**
 * Applies bias to different inversions to match common practice
 * @param {number} inversion - Inversion number
 * @returns {number} Bias value
 */
function getInversionBias(inversion) {
    const biases = {
        0: 0.05,  // Root position: slight penalty
        1: -0.05, // First inversion: slight advantage
        2: 0.1,   // Second inversion: moderate penalty
        3: 0.2    // Third inversion: significant penalty
    };
    return biases[inversion] || 0;
}

/**
 * Determines if an inversion should be used based on progression context
 * @param {number} position - Position in the progression
 * @param {number} length - Total progression length
 * @returns {boolean} Whether to use an inversion
 */
export function shouldUseInversion(position, length) {
    if (position === 0) return Math.random() < 0.15;         // First chord
    if (position === length - 1) return Math.random() < 0.25; // Last chord
    return Math.random() < 0.55;                             // Middle chords
}

/**
 * Formats a chord symbol with inversion
 * @param {string} root - Root note
 * @param {string} quality - Chord quality
 * @param {string} bassNote - Bass note for inversion
 * @returns {string} Formatted chord symbol
 */
export function formatInversionSymbol(root, quality, bassNote) {
    if (!bassNote || bassNote === root) return root + quality;
    return `${root}${quality}/${bassNote}`;
}

/**
 * Processes a chord progression to apply inversions for better voice leading
 * @param {string[]} progression - Array of chord symbols
 * @returns {string[]} Progression with inversions applied where appropriate
 */
export function applyProgressionInversions(progression) {
    if (!progression || progression.length === 0) return progression;

    const result = [];
    let previousNotes = null;

    progression.forEach((chordSymbol, index) => {
        const parsed = parseChordSymbol(chordSymbol);
        if (!parsed) {
            result.push(chordSymbol);
            return;
        }

        const { root, quality, suffix } = parsed;

        // Decide whether to use an inversion for this chord
        if (!shouldUseInversion(index, progression.length)) {
            result.push(chordSymbol);
            
            // Update previous notes for next iteration
            previousNotes = getNotesFromChordSymbol(chordSymbol);
            return;
        }

        // Get possible inversions and select the best one
        const chordNotes = getNotesFromChordSymbol(chordSymbol);
        const inversions = getInversions(chordNotes);
        const bestInversion = selectBestInversion(inversions, previousNotes);

        // Update previous notes for next iteration
        previousNotes = bestInversion.notes;

        // Add the chord with inversion to the result
        if (bestInversion.inversion === 0) {
            result.push(chordSymbol);
        } else {
            const symbol = formatInversionSymbol(root, suffix, bestInversion.bassNote);
            result.push(symbol);
        }
    });

    return result;
}