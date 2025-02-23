import { MODES } from './modes';
import { calculateModalRoot, romanToChordSymbols } from './core';
import { applyProgressionInversions } from './inversions';

function getTonicChord(mode) {
    if (!mode || !mode.chordQualities) {
        return 'I';
    }
    const tonicQuality = mode.chordQualities.I || mode.chordQualities.i;
    return (tonicQuality === 'major' || tonicQuality === 'augmented') ? 'I' : 'i';
}

function selectNextChord(currentChord, transitions, mode) {
    if (!transitions || !currentChord) {
        console.error('Invalid transitions or currentChord:', { transitions, currentChord });
        return 'I';
    }
    const probabilities = transitions[currentChord];
    if (!probabilities) {
        console.error('No transitions found for chord:', currentChord);
        return getTonicChord(mode);
    }
    const random = Math.random();
    let cumulativeProbability = 0;
    for (const [chord, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) {
            return chord;
        }
    }
    return Object.keys(probabilities)[0];
}

function generateChordProgression(length = 4, mode = MODES.ionian) {
    if (!mode || !mode.transitions) {
        console.error('Invalid mode:', mode);
        mode = MODES.ionian;
    }
    const tonic = getTonicChord(mode);
    const progression = [tonic];
    for (let i = 1; i < length; i++) {
        const currentChord = progression[progression.length - 1];
        const nextChord = selectNextChord(currentChord, mode.transitions, mode);
        progression.push(nextChord);
    }
    return progression;
}

export function generateProgression(length = 4, key = 'C', modeName = 'ionian', useInversions = true) {
    let mode = typeof modeName === 'string' ? MODES[modeName] || MODES.ionian : modeName;
    if (!mode) {
        console.error('Invalid mode, falling back to ionian');
        mode = MODES.ionian;
    }
    const modalRoot = calculateModalRoot(key, mode);
    const romanNumerals = generateChordProgression(length, mode);
    const progression = romanToChordSymbols(romanNumerals, modalRoot, mode);
    return useInversions ? applyProgressionInversions(progression) : progression;
}