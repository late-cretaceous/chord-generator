import { NOTES, parseChordSymbol, getNotesFromChordSymbol } from './core';

/**
 * Determines the possible inversions for a chord with reordered notes
 * @param {string[]} chordNotes - Array of notes in the chord
 * @returns {Array<{inversion: number, bassNote: string, notes: string[]}>} Possible inversions
 */
export function getInversions(chordNotes) {
    if (!chordNotes || !chordNotes.length) return [];

    const inversions = [];
    for (let i = 0; i < chordNotes.length; i++) {
        const bassNote = chordNotes[i];
        const reorderedNotes = [...chordNotes.slice(i), ...chordNotes.slice(0, i)];
        inversions.push({
            inversion: i,
            bassNote,
            notes: reorderedNotes
        });
    }
    return inversions;
}

/**
 * Calculates voice leading distance between two chords by position
 * @param {string[]} previousChord - Notes of the previous chord
 * @param {string[]} currentChord - Notes of the current chord
 * @returns {number} Average voice leading distance per voice
 */
function calculateVoiceLeadingDistance(previousChord, currentChord) {
    if (!previousChord || !currentChord || !previousChord.length || !currentChord.length) {
        return Infinity;
    }

    const noteIndices = {};
    NOTES.forEach((note, index) => noteIndices[note] = index);

    let totalDistance = 0;
    const minVoices = Math.min(previousChord.length, currentChord.length);

    // Pair notes by position (e.g., bass to bass)
    for (let i = 0; i < minVoices; i++) {
        const prevNote = previousChord[i];
        const currNote = currentChord[i];
        if (!noteIndices.hasOwnProperty(prevNote) || !noteIndices.hasOwnProperty(currNote)) {
            continue;
        }

        const prevIndex = noteIndices[prevNote];
        const currIndex = noteIndices[currNote];
        const distance = Math.min(
            Math.abs(currIndex - prevIndex),
            12 - Math.abs(currIndex - prevIndex)
        );
        totalDistance += distance;
    }

    return minVoices > 0 ? totalDistance / minVoices : Infinity;
}

/**
 * Selects best inversion based on voice leading
 * @param {Array<{inversion: number, bassNote: string, notes: string[]}>} inversions - Possible inversions
 * @param {string[]} previousChordNotes - Notes of the previous chord
 * @returns {Object} Best inversion based on voice leading
 */
function selectBestInversion(inversions, previousChordNotes) {
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
 * Determines if an inversion improves voice leading over root position
 * @param {string[]} currentChordNotes - Notes of the current chord
 * @param {string[]} previousChordNotes - Notes of the previous chord
 * @returns {{ shouldInvert: boolean, bestInversion: Object }} Decision and best inversion
 */
function assessInversionBenefit(currentChordNotes, previousChordNotes) {
    if (!previousChordNotes || !previousChordNotes.length) {
        console.log('No previous notes, skipping inversion');
        return { shouldInvert: false, bestInversion: null };
    }

    const inversions = getInversions(currentChordNotes);
    if (!inversions.length) {
        console.log('No inversions available');
        return { shouldInvert: false, bestInversion: null };
    }

    const rootDistance = calculateVoiceLeadingDistance(previousChordNotes, inversions[0].notes);
    const bestInversion = selectBestInversion(inversions, previousChordNotes);
    const bestDistance = calculateVoiceLeadingDistance(previousChordNotes, bestInversion.notes);

    console.log(`Root Distance: ${rootDistance}, Best Distance: ${bestDistance}, Improvement: ${rootDistance - bestDistance}`);

    const improvementThreshold = 0.5;
    const shouldInvert = (rootDistance - bestDistance) > improvementThreshold;

    return { shouldInvert, bestInversion };
}

/**
 * Formats a chord symbol with inversion
 * @param {string} root - Root note
 * @param {string} quality - Chord quality suffix
 * @param {string} bassNote - Bass note for inversion
 * @returns {string} Formatted chord symbol
 */
export function formatInversionSymbol(root, quality, bassNote) {
    if (!bassNote || bassNote === root) return root + quality;
    return `${root}${quality}/${bassNote}`;
}

/**
 * Processes a chord progression to apply inversions for optimal voice leading
 * @param {string[]} progression - Array of chord symbols
 * @returns {string[]} Progression with inversions applied where beneficial
 */
export function applyProgressionInversions(progression) {
    if (!progression || progression.length === 0) return progression;

    const result = [];
    let previousNotes = null;

    progression.forEach((chordSymbol) => {
        const parsed = parseChordSymbol(chordSymbol);
        if (!parsed) {
            result.push(chordSymbol);
            previousNotes = getNotesFromChordSymbol(chordSymbol);
            return;
        }

        const { root, quality, suffix } = parsed;
        const chordNotes = getNotesFromChordSymbol(chordSymbol);

        const { shouldInvert, bestInversion } = assessInversionBenefit(chordNotes, previousNotes);

        if (shouldInvert && bestInversion && bestInversion.inversion !== 0) {
            const invertedSymbol = formatInversionSymbol(root, suffix, bestInversion.bassNote);
            result.push(invertedSymbol);
            previousNotes = bestInversion.notes;
        } else {
            result.push(chordSymbol);
            previousNotes = chordNotes;
        }
    });

    return result;
}