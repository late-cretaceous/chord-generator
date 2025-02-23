export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MODE_PATTERNS = {
    ionian: {
        intervals: [0, 2, 4, 5, 7, 9, 11],
        chords: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']
    },
    // [Other modes unchanged]
};

export const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    dominant7: [0, 4, 7, 10],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    minorMajor7: [0, 3, 7, 11],
    diminished7: [0, 3, 6, 9],
    half_diminished7: [0, 3, 6, 10],
    // [Other chords unchanged]
};

/**
 * [getModePattern, generateScaleNotes, getRomanNumeral unchanged]
 */

/**
 * Converts a chord quality to its common symbol
 * @param {string} quality - Chord quality (e.g., 'major', 'minor7')
 * @returns {string} Symbol to append to root note
 */
export function getQualitySymbol(quality) {
    const normalized = quality.toLowerCase();
    const symbols = {
        'major': '',
        'minor': 'm',
        'diminished': 'dim',
        'augmented': 'aug',
        'dominant7': '7',
        'major7': 'maj7',
        'minor7': 'm7',
        'minormajor7': 'mM7',
        'diminished7': 'dim7',
        'half_diminished7': 'm7b5'
    };
    const result = symbols[normalized] || '';
    return result;
}
/**
 * Gets notes for a chord given root note and chord type
 * @param {string} rootNote - Root note of the chord
 * @param {string} chordType - Type of chord from CHORD_INTERVALS
 * @returns {string[]} Array of notes in the chord
 */
export function getChordNotes(rootNote, chordType) {
    const rootIndex = NOTES.indexOf(rootNote);
    if (rootIndex === -1) throw new Error('Invalid root note');
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) throw new Error('Invalid chord type: ' + chordType);
    return intervals.map(interval => NOTES[(rootIndex + interval) % 12]);
}

/**
 * Parses a chord symbol into its components
 * @param {string} chordSymbol - Chord symbol (e.g., "Cm", "G7")
 * @returns {{root: string, quality: string, suffix: string} | null}
 */
export function parseChordSymbol(chordSymbol) {
    if (!chordSymbol) return null;
    const match = chordSymbol.match(/^([A-G][#]?)([a-z0-9]*)$/);
    if (!match) return null;
    const [, root, suffix] = match;
    const qualityMap = {
        '': 'major',
        'm': 'minor',
        'min': 'minor',
        'dim': 'diminished',
        'aug': 'augmented',
        '7': 'dominant7',
        'maj7': 'major7',
        'm7': 'minor7',
        'mM7': 'minorMajor7',
        'dim7': 'diminished7',
        'm7b5': 'half_diminished7'
    };
    return { root, quality: qualityMap[suffix] || 'major', suffix: suffix || '' };
}

/**
 * Gets notes for a chord from its symbol
 * @param {string} chordSymbol - Chord symbol (e.g., "Cm", "G7")
 * @returns {string[]} Array of notes in the chord
 */
export function getNotesFromChordSymbol(chordSymbol) {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return [chordSymbol];
    return getChordNotes(parsed.root, parsed.quality);
}

/**
 * [getModeChords unchanged]
 */

/**
 * Gets the root note for a given scale degree in a key
 * @param {string} key - The key (e.g., 'C')
 * @param {number} scaleDegree - The scale degree (0-6)
 * @param {Object} mode - Mode definition containing intervals
 * @returns {string} The root note for that scale degree
 */
export function getScaleDegreeRoot(key, scaleDegree, mode) {
    if (!mode || !mode.intervals) {
        mode = MODE_PATTERNS.ionian;
    }
    const keyIndex = NOTES.indexOf(key);
    if (keyIndex === -1) throw new Error(`Invalid key: ${key}`);
    const noteIndex = (keyIndex + mode.intervals[scaleDegree]) % 12;
    return NOTES[noteIndex];
}

/**
 * Get the correct modal root based on key and mode
 * @param {string} key - The tonic key (e.g., 'C')
 * @param {string|Object} mode - The mode object or name
 * @returns {string} The modal root note
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
 * Converts roman numeral progression to actual chord symbols
 * @param {string[]} progression - Array of roman numerals
 * @param {string} key - Key to generate progression in (e.g., 'C')
 * @param {Object} mode - Mode definition containing chord qualities
 * @returns {string[]} Array of chord symbols (e.g., ['Cm', 'Dm', 'E♭', 'F'])
 */
export function romanToChordSymbols(progression, key = 'C', mode = MODE_PATTERNS.ionian) {
    if (!mode) {
        mode = MODE_PATTERNS.ionian;
    }
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
        if (!romanNumeralMap[numeral]) {
            return 'C';
        }
        const { degree, quality } = romanNumeralMap[numeral];
        const root = getScaleDegreeRoot(key, degree, mode);
        const suffix = getQualitySymbol(quality);
        return root + suffix;
    });
}