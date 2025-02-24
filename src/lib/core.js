// Basic music theory constants and utilities
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MODE_PATTERNS = {
    ionian: { intervals: [0, 2, 4, 5, 7, 9, 11], chords: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'] },
    // [Other modes unchanged]
};

export const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    // [Other chords unchanged]
};

/**
 * NEW: Converts pitch class to MIDI note number with octave
 */
export function pitchToMidi(pitchClass, octave) {
    const pitchIndex = NOTES.indexOf(pitchClass);
    if (pitchIndex === -1) throw new Error(`Invalid pitch class: ${pitchClass}`);
    return pitchIndex + (octave + 1) * 12; // C-1 = 0, C0 = 12, C2 = 36
}

/**
 * NEW: Converts MIDI note number to pitch with octave
 */
export function midiToPitch(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const pitchIndex = midi % 12;
    return `${NOTES[pitchIndex]}${octave}`;
}

/**
 * UPDATED: Gets notes for a chord with specific pitches
 */
export function getChordNotes(root, chordType, rootOctave = 2) {
    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) throw new Error('Invalid root note');
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) throw new Error('Invalid chord type');

    const rootMidi = pitchToMidi(root, rootOctave);
    return intervals.map(interval => midiToPitch(rootMidi + interval));
}

/**
 * UPDATED: Gets notes for a chord from its symbol
 */
export function getNotesFromChordSymbol(chordSymbol, rootOctave = 2) {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return [chordSymbol];
    return getChordNotes(parsed.root, parsed.quality, rootOctave);
}

/**
 * Parses a chord symbol into its components
 */
export function parseChordSymbol(chordSymbol) {
    if (!chordSymbol) return null;
    const match = chordSymbol.match(/^([A-G][#]?)([a-z0-9]*)$/);
    if (!match) return null;
    const [, root, suffix] = match;
    const qualityMap = {
        '': 'major',
        'm': 'minor',
        'dim': 'diminished',
        // [Other mappings unchanged]
    };
    return { root, quality: qualityMap[suffix] || 'major', suffix: suffix || '' };
}

/**
 * Gets the root note for a given scale degree in a key
 */
export function getScaleDegreeRoot(key, scaleDegree, mode) {
    if (!mode || !mode.intervals) mode = MODE_PATTERNS.ionian;
    const keyIndex = NOTES.indexOf(key);
    if (keyIndex === -1) throw new Error(`Invalid key: ${key}`);
    const noteIndex = (keyIndex + mode.intervals[scaleDegree]) % 12;
    return NOTES[noteIndex];
}

/**
 * Converts roman numeral progression to chord symbols (pitch-class based)
 */
export function romanToChordSymbols(progression, key = 'C', mode = MODE_PATTERNS.ionian) {
    if (!mode) mode = MODE_PATTERNS.ionian;
    const qualities = mode.chordQualities || mode.chords || {};
    const romanNumeralMap = {};
    for (let i = 0; i < progression.length; i++) {
        const numeral = progression[i];
        const degree = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']
            .indexOf(numeral.toLowerCase());
        const quality = qualities[numeral] || (mode.chords && mode.chords[degree]) || 'major';
        if (degree !== -1) {
            romanNumeralMap[numeral] = { degree, quality };
        }
    }
    return progression.map(numeral => {
        if (!romanNumeralMap[numeral]) return 'C';
        const { degree, quality } = romanNumeralMap[numeral];
        const root = getScaleDegreeRoot(key, degree, mode);
        const suffix = getQualitySymbol(quality);
        return root + suffix;
    });
}

/**
 * Get the correct modal root based on key and mode
 */
export function calculateModalRoot(key, mode) {
    let modeName;
    if (typeof mode === 'string') {
        modeName = mode;
    } else if (mode && mode.name) {
        modeName = mode.name;
    } else {
        modeName = 'ionian';
    }
    const modeSteps = {
        'ionian': 0,
        'dorian': 1,
        'phrygian': 2,
        'lydian': 3,
        'mixolydian': 4,
        'aeolian': 5,
        'locrian': 6
    };
    const step = modeSteps[modeName.toLowerCase()] || 0;
    const keyIndex = NOTES.indexOf(key);
    if (keyIndex === -1) return key;
    const majorScaleIntervals = MODE_PATTERNS.ionian.intervals;
    const targetInterval = majorScaleIntervals[step];
    const modalRootIndex = (keyIndex + targetInterval) % 12;
    return NOTES[modalRootIndex];
}

/**
 * Converts a chord quality to its common symbol
 */
export function getQualitySymbol(quality) {
    const normalizedQuality = quality.toLowerCase();
    const symbols = {
        'major': '',
        'minor': 'm',
        'diminished': 'dim',
        // [Other mappings unchanged]
    };
    return symbols[normalizedQuality] || normalizedQuality;
}

