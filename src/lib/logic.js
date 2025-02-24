import { MODES } from './modes';
import { calculateModalRoot, romanToChordSymbols, getNotesFromChordSymbol, parseChordSymbol } from './core'; // Added parseChordSymbol
import { applyProgressionInversions } from './inversions';

function getTonicChord(mode) {
    if (!mode || !mode.chordQualities) return 'I';
    const tonicQuality = mode.chordQualities.I || mode.chordQualities.i;
    return (tonicQuality === 'major' || tonicQuality === 'augmented') ? 'I' : 'i';
}

function selectNextChord(currentChord, transitions, mode) {
    if (!transitions || !currentChord) {
        console.error('Invalid transitions or currentChord:', { transitions, currentChord });
        return 'I';
    }
    const probabilities = transitions[currentChord];
    if (!probabilities) return getTonicChord(mode);
    const random = Math.random();
    let cumulativeProbability = 0;
    for (const [chord, probability] of Object.entries(probabilities)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) return chord;
    }
    return Object.keys(probabilities)[0];
}

function generateChordProgression(length = 4, mode = MODES.ionian) {
    if (!mode || !mode.transitions) mode = MODES.ionian;
    const tonic = getTonicChord(mode);
    const progression = [tonic];
    for (let i = 1; i < length; i++) {
        const currentChord = progression[progression.length - 1];
        const nextChord = selectNextChord(currentChord, mode.transitions, mode);
        progression.push(nextChord);
    }
    return progression;
}

/**
 * Main composition function with pitch-specific output
 * @returns {Array<{root: string, quality: string, bass: string, notes: string[]}>}
 */
export function generateProgression(length = 4, key = 'C', modeName = 'ionian', useInversions = true, rootOctave = 2) {
    let mode = typeof modeName === 'string' ? MODES[modeName] || MODES.ionian : modeName;
    if (!mode) mode = MODES.ionian;
    const modalRoot = calculateModalRoot(key, mode);

    const romanNumerals = generateChordProgression(length, mode);
    const chordSymbols = romanToChordSymbols(romanNumerals, modalRoot, mode);

    // Convert to pitch-specific chords
    const progression = chordSymbols.map(symbol => {
        const parsed = parseChordSymbol(symbol);
        if (!parsed) return { root: symbol, quality: '', bass: `${symbol}${rootOctave}`, notes: [symbol] };
        const notes = getNotesFromChordSymbol(symbol, rootOctave);
        return {
            root: parsed.root,
            quality: parsed.suffix,
            bass: notes[0], // Root position initially
            notes
        };
    });

    return useInversions ? applyProgressionInversions(progression, { rootOctave }) : progression;
}