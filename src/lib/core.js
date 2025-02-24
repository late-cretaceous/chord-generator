// Basic music theory constants and utilities

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MODE_PATTERNS = {
    ionian: { intervals: [0, 2, 4, 5, 7, 9, 11], chords: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'] },
    // [Other modes unchanged]
};

// Extended chord intervals with additional chord types
export const CHORD_INTERVALS = {
    // Base triads
    major: [0, 4, 7],
    minor: [0, 3, 7],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
    
    // Seventh chords
    dominant7: [0, 4, 7, 10],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    diminished7: [0, 3, 6, 9],
    halfDiminished7: [0, 3, 6, 10],
    minorMajor7: [0, 3, 7, 11],
    
    // Add chords
    add9: [0, 4, 7, 14],
    madd9: [0, 3, 7, 14],
    
    // Extended chords
    dominant9: [0, 4, 7, 10, 14],
    major9: [0, 4, 7, 11, 14],
    minor9: [0, 3, 7, 10, 14]
};

/**
 * Converts pitch class to MIDI note number with octave
 */
export function pitchToMidi(pitchClass, octave) {
    const pitchIndex = NOTES.indexOf(pitchClass);
    if (pitchIndex === -1) throw new Error(`Invalid pitch class: ${pitchClass}`);
    return pitchIndex + (octave + 1) * 12; // C-1 = 0, C0 = 12, C2 = 36
}

/**
 * Converts MIDI note number to pitch with octave
 */
export function midiToPitch(midi) {
    const octave = Math.floor(midi / 12) - 1;
    const pitchIndex = midi % 12;
    return `${NOTES[pitchIndex]}${octave}`;
}

/**
 * Gets notes for a chord with specific pitches
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
 * Gets notes for a chord from its symbol
 */
export function getNotesFromChordSymbol(chordSymbol, rootOctave = 2) {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return [chordSymbol];
    return getChordNotes(parsed.root, parsed.quality, rootOctave);
}

/**
 * UPDATED: Parses a chord symbol into its components with extended support
 */
export function parseChordSymbol(chordSymbol) {
    if (!chordSymbol) return null;
    // Enhanced regex to support more complex chord symbols
    const match = chordSymbol.match(/^([A-G][#]?)([a-zA-Z0-9#]*)$/);
    if (!match) return null;
    const [, root, suffix] = match;
    
    // Extended mapping from chord suffixes to internal chord types
    const qualityMap = {
        // Triads
        '': 'major',
        'm': 'minor',
        'dim': 'diminished',
        'aug': 'augmented',
        'sus2': 'sus2',
        'sus4': 'sus4',
        
        // Seventh chords
        '7': 'dominant7',
        'maj7': 'major7',
        'M7': 'major7',
        'm7': 'minor7',
        'dim7': 'diminished7',
        'm7b5': 'halfDiminished7',
        'ø7': 'halfDiminished7',
        'mM7': 'minorMajor7',
        
        // Add chords
        'add9': 'add9',
        'madd9': 'madd9',
        
        // Extended chords
        '9': 'dominant9',
        'maj9': 'major9',
        'M9': 'major9',
        'm9': 'minor9'
    };
    
    return { 
        root, 
        quality: qualityMap[suffix] || 'major', 
        suffix: suffix || '' 
    };
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
 * ENHANCED: Converts roman numeral progression to chord symbols with extended support
 */
export function romanToChordSymbols(progression, key = 'C', mode = MODE_PATTERNS.ionian) {
    if (!mode) mode = MODE_PATTERNS.ionian;
    const qualities = mode.chordQualities || mode.chords || {};
    
    return progression.map(numeral => {
        // Parse for extensions like V7, ii7, etc.
        const match = numeral.match(/^([ivIV]+)(\d*.*)/);
        if (!match) return 'C';
        
        const [, baseNumeral, extension] = match;
        
        // Get the scale degree
        const degree = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii']
            .indexOf(baseNumeral.toLowerCase());
        
        if (degree === -1) return 'C';
        
        // Get base quality
        let quality = qualities[baseNumeral] || 
                    (mode.chords && mode.chords[degree]) || 
                    'major';
        
        // Apply chord extension if present
        if (extension) {
            if (extension === '7') {
                if (quality === 'major') {
                    quality = 'dominant7';
                } else if (quality === 'minor') {
                    quality = 'minor7';
                } else if (quality === 'diminished') {
                    quality = 'diminished7';
                }
            } else if (extension === 'maj7' || extension === 'M7') {
                quality = quality === 'minor' ? 'minorMajor7' : 'major7';
            } else if (extension === '9') {
                if (quality === 'major') {
                    quality = 'dominant9';
                } else if (quality === 'minor') {
                    quality = 'minor9';
                }
            } else if (extension === 'maj9' || extension === 'M9') {
                quality = 'major9';
            }
        }
        
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
 * UPDATED: Converts a chord quality to its common symbol
 */
export function getQualitySymbol(quality) {
    const normalizedQuality = quality.toLowerCase();
    const symbols = {
        // Triads
        'major': '',
        'minor': 'm',
        'diminished': 'dim',
        'augmented': 'aug',
        'sus2': 'sus2',
        'sus4': 'sus4',
        
        // Seventh chords
        'dominant7': '7',
        'major7': 'maj7',
        'minor7': 'm7',
        'diminished7': 'dim7',
        'halfdiminished7': 'm7b5',
        'minormajor7': 'mM7',
        
        // Add chords
        'add9': 'add9',
        'madd9': 'madd9',
        
        // Extended chords
        'dominant9': '9',
        'major9': 'maj9',
        'minor9': 'm9'
    };
    
    return symbols[normalizedQuality] || normalizedQuality;
}