import { NOTES, pitchToMidi, midiToPitch, parseChordSymbol } from './core';

export function getInversions(chord) {
    if (!chord.notes || !chord.notes.length) return [];
    const pitchClasses = chord.notes.map(note => note.replace(/[0-9]/, ''));

    const inversions = [];
    for (let i = 0; i < pitchClasses.length; i++) {
        const bassPitchClass = pitchClasses[i];
        const reorderedPitchClasses = [...pitchClasses.slice(i), ...pitchClasses.slice(0, i)];
        const bassMidi = pitchToMidi(bassPitchClass, 2); // Start at octave 2
        const notes = reorderedPitchClasses.map((pc, idx) => {
            const midiOffset = idx * 4; // Stack upward, approx. major third intervals
            return midiToPitch(bassMidi + midiOffset);
        });
        inversions.push({
            inversion: i,
            bassNote: notes[0],
            notes
        });
    }
    return inversions;
}

function calculateVoiceLeadingDistance(previousChord, currentChord) {
    if (!previousChord || !currentChord || !previousChord.length || !currentChord.length) {
        return Infinity;
    }

    let totalDistance = 0;
    const minVoices = Math.min(previousChord.length, currentChord.length);

    for (let i = 0; i < minVoices; i++) {
        const prevMidi = pitchToMidi(previousChord[i].replace(/[0-9]/, ''), parseInt(previousChord[i].slice(-1)));
        const currMidi = pitchToMidi(currentChord[i].replace(/[0-9]/, ''), parseInt(currentChord[i].slice(-1)));
        const distance = Math.abs(currMidi - prevMidi);
        totalDistance += distance;
    }

    return minVoices > 0 ? totalDistance / minVoices : Infinity;
}

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

function getInversionBias(inversion) {
    const biases = {
        0: 0.05,
        1: -0.05,
        2: 0.1,
        3: 0.2
    };
    return biases[inversion] || 0;
}

function assessInversionBenefit(currentChord, previousChord) {
    if (!previousChord || !previousChord.notes.length) {
        console.log('No previous notes, skipping inversion');
        return { shouldInvert: false, bestInversion: null };
    }

    const inversions = getInversions(currentChord);
    if (!inversions.length) {
        console.log('No inversions available');
        return { shouldInvert: false, bestInversion: null };
    }

    const rootDistance = calculateVoiceLeadingDistance(previousChord.notes, inversions[0].notes);
    const bestInversion = selectBestInversion(inversions, previousChord.notes);
    const bestDistance = calculateVoiceLeadingDistance(previousChord.notes, bestInversion.notes);

    console.log(`Root Distance: ${rootDistance}, Best Distance: ${bestDistance}, Improvement: ${rootDistance - bestDistance}`);

    const improvementThreshold = 0.5;
    const shouldInvert = (rootDistance - bestDistance) > improvementThreshold;

    return { shouldInvert, bestInversion };
}

/**
 * Applies inversions to a pitch-specific progression
 * @param {Array<{root: string, quality: string, bass: string, notes: string[]}>} progression
 * @returns {Array<{root: string, quality: string, bass: string, notes: string[]}>}
 */
export function applyProgressionInversions(progression) {
    if (!progression || progression.length === 0) return progression;

    const result = [];
    let previousChord = null;

    progression.forEach((chord) => {
        const { shouldInvert, bestInversion } = assessInversionBenefit(chord, previousChord);

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