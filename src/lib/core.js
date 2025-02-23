// Basic music theory constants and utilities
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MODE_PATTERNS = {
    ionian: {
        intervals: [0, 2, 4, 5, 7, 9, 11],
        chords: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished']
    },
    dorian: {
        intervals: [0, 2, 3, 5, 7, 9, 10],
        chords: ['minor', 'minor', 'major', 'major', 'minor', 'diminished', 'major']
    },
    phrygian: {
        intervals: [0, 1, 3, 5, 7, 8, 10],
        chords: ['minor', 'major', 'major', 'minor', 'diminished', 'major', 'minor']
    },
    lydian: {
        intervals: [0, 2, 4, 6, 7, 9, 11],
        chords: ['major', 'major', 'minor', 'diminished', 'major', 'minor', 'minor']
    },
    mixolydian: {
        intervals: [0, 2, 4, 5, 7, 9, 10],
        chords: ['major', 'minor', 'diminished', 'major', 'minor', 'minor', 'major']
    },
    aeolian: {
        intervals: [0, 2, 3, 5, 7, 8, 10],
        chords: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major']
    },
    locrian: {
        intervals: [0, 1, 3, 5, 6, 8, 10],
        chords: ['diminished', 'major', 'minor', 'minor', 'major', 'major', 'minor']
    }
};

export const CHORD_INTERVALS = {
    // Basic triads
    major: [0, 4, 7],              // Root, Major Third, Perfect Fifth
    minor: [0, 3, 7],              // Root, Minor Third, Perfect Fifth
    diminished: [0, 3, 6],         // Root, Minor Third, Diminished Fifth
    augmented: [0, 4, 8],          // Root, Major Third, Augmented Fifth

    // Suspended chords
    sus2: [0, 2, 7],              // Root, Major Second, Perfect Fifth
    sus4: [0, 5, 7],              // Root, Perfect Fourth, Perfect Fifth

    // Seventh chords
    dominant7: [0, 4, 7, 10],      // Root, Major Third, Perfect Fifth, Minor Seventh
    major7: [0, 4, 7, 11],         // Root, Major Third, Perfect Fifth, Major Seventh
    minor7: [0, 3, 7, 10],         // Root, Minor Third, Perfect Fifth, Minor Seventh
    minorMajor7: [0, 3, 7, 11],    // Root, Minor Third, Perfect Fifth, Major Seventh
    diminished7: [0, 3, 6, 9],     // Root, Minor Third, Diminished Fifth, Diminished Seventh
    half_diminished7: [0, 3, 6, 10],// Root, Minor Third, Diminished Fifth, Minor Seventh
    augmented7: [0, 4, 8, 10],     // Root, Major Third, Augmented Fifth, Minor Seventh
    augmentedMajor7: [0, 4, 8, 11],// Root, Major Third, Augmented Fifth, Major Seventh

    // Extended chords (Ninths)
    dominant9: [0, 4, 7, 10, 14],   // Dominant 7 + Major Ninth
    major9: [0, 4, 7, 11, 14],      // Major 7 + Major Ninth
    minor9: [0, 3, 7, 10, 14],      // Minor 7 + Major Ninth
    
    // Extended chords (11ths)
    dominant11: [0, 4, 7, 10, 14, 17], // Dominant 9 + Perfect 11th
    major11: [0, 4, 7, 11, 14, 17],    // Major 9 + Perfect 11th
    minor11: [0, 3, 7, 10, 14, 17],    // Minor 9 + Perfect 11th

    // Extended chords (13ths)
    dominant13: [0, 4, 7, 10, 14, 17, 21], // Dominant 11 + Major 13th
    major13: [0, 4, 7, 11, 14, 17, 21],    // Major 11 + Major 13th
    minor13: [0, 3, 7, 10, 14, 17, 21],    // Minor 11 + Major 13th

    // Added tone chords
    add2: [0, 2, 4, 7],           // Major + Major Second
    add4: [0, 4, 5, 7],           // Major + Perfect Fourth
    add6: [0, 4, 7, 9],           // Major + Major Sixth
    minorAdd2: [0, 2, 3, 7],      // Minor + Major Second
    minorAdd4: [0, 3, 5, 7],      // Minor + Perfect Fourth
    minorAdd6: [0, 3, 7, 9],      // Minor + Major Sixth

    // Six chords
    major6: [0, 4, 7, 9],         // Major + Major Sixth
    minor6: [0, 3, 7, 9],         // Minor + Major Sixth
    
    // Special voicings
    quartal: [0, 5, 10],          // Built in perfect fourths
    quintal: [0, 7, 14],          // Built in perfect fifths
    
    // Power chord
    power: [0, 7]                 // Root and Fifth only
};

/**
 * Gets the pattern for a specific mode
 * @param {string} modeName - Name of the mode (e.g., 'ionian', 'dorian')
 * @returns {Object} Mode pattern containing intervals and chord qualities
 */
export function getModePattern(modeName) {
    const mode = MODE_PATTERNS[modeName.toLowerCase()];
    if (!mode) throw new Error(`Unknown mode: ${modeName}`);
    return mode;
}

/**
 * Generates scale notes from a root note and intervals
 * @param {string} root - Root note (e.g., 'C', 'F#')
 * @param {number[]} intervals - Array of intervals in semitones
 * @returns {string[]} Array of note names in the scale
 */
export function generateScaleNotes(root, intervals) {
    const rootIndex = NOTES.indexOf(root);
    if (rootIndex === -1) throw new Error(`Invalid root note: ${root}`);
    
    return intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
}

/**
 * Converts a scale degree and quality to a roman numeral
 * @param {number} degree - Scale degree (0-6)
 * @param {string} quality - Chord quality ('major', 'minor', etc.)
 * @returns {string} Roman numeral notation
 */
export function getRomanNumeral(degree, quality) {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    const numeral = numerals[degree];
    return quality === 'major' ? numeral : numeral.toLowerCase();
}

/**
 * Converts a chord quality to its common symbol
 * @param {string} quality - Chord quality (e.g., 'major', 'minor')
 * @returns {string} Symbol to append to root note
 */
export function getQualitySymbol(quality) {
    const symbols = {
        'major': '',
        'minor': 'm',
        'diminished': 'dim',
        'augmented': 'aug',
        'dominant7': '7',
        'major7': 'maj7',
        'minor7': 'm7',
        'diminished7': 'dim7',
        'half_diminished7': 'm7b5'
    };
    return symbols[quality] || quality;
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
    if (!intervals) throw new Error('Invalid chord type');
    
    return intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
}

/**
 * Parses a chord symbol into its components
 * @param {string} chordSymbol - Chord symbol (e.g., "Cm", "F", "G7")
 * @returns {{root: string, quality: string, suffix: string} | null}
 */
export function parseChordSymbol(chordSymbol) {
    if (!chordSymbol) return null;

    const match = chordSymbol.match(/^([A-G][#]?)([a-z0-9]*$)/);
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
        'dim7': 'diminished7'
    };

    return {
        root,
        quality: qualityMap[suffix] || 'major',
        suffix: suffix || ''
    };
}

/**
 * Gets notes for a chord from its symbol
 * @param {string} chordSymbol - Chord symbol (e.g., "Cm", "F", "G7")
 * @returns {string[]} Array of notes in the chord
 */
export function getNotesFromChordSymbol(chordSymbol) {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return [chordSymbol];
    
    return getChordNotes(parsed.root, parsed.quality);
}

/**
 * Gets all notes and chords for a given root note and mode
 * @param {string} root - Root note (e.g., 'C', 'F#')
 * @param {string} modeName - Name of the mode (e.g., 'ionian', 'dorian')
 * @returns {Object} Complete mode information including scale and chords
 */
export function getModeChords(root, modeName) {
    const mode = getModePattern(modeName);
    const scaleNotes = generateScaleNotes(root, mode.intervals);
    
    const chords = scaleNotes.map((note, index) => ({
        root: note,
        quality: mode.chords[index],
        numeral: getRomanNumeral(index, mode.chords[index]),
        notes: getChordNotes(note, mode.chords[index]),
        symbol: `${note}${getQualitySymbol(mode.chords[index])}`
    }));

    return {
        root,
        mode: modeName,
        scale: scaleNotes,
        chords
    };
}