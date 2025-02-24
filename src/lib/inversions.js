import { NOTES, pitchToMidi, midiToPitch, parseChordSymbol } from './core';

export function getInversions(chord) {
    if (!chord.notes || !chord.notes.length) return [];
    const inversions = [];
    for (let i = 0; i < chord.notes.length; i++) {
        const reorderedNotes = [...chord.notes.slice(i), ...chord.notes.slice(0, i)];
        inversions.push({
            inversion: i,
            bassNote: reorderedNotes[0],
            notes: reorderedNotes
        });
    }
    console.log('Inversions for', chord.notes, ':', inversions);
    return inversions;
}

function calculateVoiceLeadingDistance(previousChord, currentChord) {
    if (!previousChord || !currentChord || !previousChord.length || !currentChord.length) {
        return Infinity;
    }

    let totalDistance = 0;
    const minVoices = Math.min(previousChord.length, currentChord.length);

    // Weight bass (index 0) more heavily
    for (let i = 0; i < minVoices; i++) {
        const prevMidi = pitchToMidi(previousChord[i].replace(/[0-9]/, ''), parseInt(previousChord[i].slice(-1)));
        const currMidi = pitchToMidi(currentChord[i].replace(/[0-9]/, ''), parseInt(currentChord[i].slice(-1)));
        const distance = Math.abs(currMidi - prevMidi);
        totalDistance += i === 0 ? distance * 2 : distance; // Double bass weight
    }

    return totalDistance; // Sum, not average
}

function selectBestInversion(inversions, previousChordNotes) {
    if (!inversions.length) return null;
    if (!previousChordNotes || !previousChordNotes.length) return inversions[0];

    const weightedInversions = inversions.map(inv => {
        const distance = calculateVoiceLeadingDistance(previousChordNotes, inv.notes) + getInversionBias(inv.inversion);
        console.log('Inversion', inv.notes, 'Distance:', distance);
        return { ...inv, distance };
    });

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

    const improvementThreshold = 1; // Adjusted for total distance
    const shouldInvert = (rootDistance - bestDistance) > improvementThreshold;

    return { shouldInvert, bestInversion };
}

export function formatInversionSymbol(root, quality, bassNote) {
    if (!bassNote || bassNote.startsWith(root)) return root + quality;
    return `${root}${quality}/${bassNote}`;
}

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