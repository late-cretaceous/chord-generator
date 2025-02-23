// src/lib/voicings.js
import { NOTES, CHORD_INTERVALS } from './core';

const VOICING_TYPES = {
    CLOSE: 'close',      // Notes as close as possible
    OPEN: 'open',        // Notes spread out
    DROP_2: 'drop2',     // Second highest note dropped an octave
    DROP_3: 'drop3'      // Third highest note dropped an octave
};

/**
 * Gets frequency for a note at a specific octave
 * @param {string} note - Note name (e.g., 'C', 'F#')
 * @param {number} octave - Octave number
 * @returns {number} Frequency in Hz
 */
export function noteToFrequency(note, octave) {
    const noteIndex = NOTES.indexOf(note);
    if (noteIndex === -1) return null;
    
    const a4 = 440;
    const noteNumber = (octave - 4) * 12 + noteIndex - 9;
    return a4 * Math.pow(2, noteNumber / 12);
}

/**
 * Parses a chord symbol into its components
 * @param {string} chordSymbol - The chord symbol (e.g., 'Cm', 'G/B')
 * @returns {Object} Parsed chord information
 */
function parseChordSymbol(chordSymbol) {
    // Check for slash chord notation (inversions)
    const [mainChord, bassNote] = chordSymbol.split('/');
    
    // Parse main chord symbol into root note and quality
    const match = mainChord.match(/^([A-G][#]?)([a-z0-9]*$)/);
    if (!match) return null;
    
    const [, rootNote, qualitySuffix] = match;
    
    // Map chord symbols to quality
    const qualityMap = {
        '': 'major',
        'm': 'minor',
        'min': 'minor',
        'dim': 'diminished',
        'aug': 'augmented',
        'maj7': 'major7',
        '7': 'dominant7',
        'm7': 'minor7',
        'dim7': 'diminished7'
    };
    
    return {
        root: rootNote,
        type: qualityMap[qualitySuffix] || 'major',
        bassNote: bassNote
    };
}

/**
 * Gets notes for a chord based on root and type
 * @param {string} rootNote - Root note
 * @param {string} chordType - Type of chord
 * @returns {string[]} Array of notes in the chord
 */
export function getChordNotes(rootNote, chordType) {
    const rootIndex = NOTES.indexOf(rootNote);
    if (rootIndex === -1) return [rootNote];
    
    const intervals = CHORD_INTERVALS[chordType];
    if (!intervals) return [rootNote];
    
    return intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        return NOTES[noteIndex];
    });
}

/**
 * Creates a close position voicing
 * @param {string[]} notes - Notes to voice
 * @param {number} baseOctave - Starting octave
 * @returns {Array<{note: string, octave: number}>} Voiced notes
 */
function createCloseVoicing(notes, baseOctave) {
    let currentOctave = baseOctave;
    let previousIndex = NOTES.indexOf(notes[0]);
    
    return notes.map((note, i) => {
        if (i === 0) return { note, octave: baseOctave };
        
        const currentIndex = NOTES.indexOf(note);
        if (currentIndex < previousIndex) currentOctave++;
        
        previousIndex = currentIndex;
        return { note, octave: currentOctave };
    });
}

/**
 * Creates an open position voicing
 * @param {string[]} notes - Notes to voice
 * @param {number} baseOctave - Starting octave
 * @returns {Array<{note: string, octave: number}>} Voiced notes
 */
function createOpenVoicing(notes, baseOctave) {
    return notes.map((note, i) => ({
        note,
        octave: baseOctave + Math.floor(i / 2)
    }));
}

/**
 * Creates a drop-2 voicing
 * @param {string[]} notes - Notes to voice
 * @param {number} baseOctave - Starting octave
 * @returns {Array<{note: string, octave: number}>} Voiced notes
 */
function createDrop2Voicing(notes, baseOctave) {
    if (notes.length < 4) return createCloseVoicing(notes, baseOctave);
    
    const voiced = createCloseVoicing(notes, baseOctave + 1);
    voiced[voiced.length - 2].octave = baseOctave;
    return voiced;
}

/**
 * Creates a drop-3 voicing
 * @param {string[]} notes - Notes to voice
 * @param {number} baseOctave - Starting octave
 * @returns {Array<{note: string, octave: number}>} Voiced notes
 */
function createDrop3Voicing(notes, baseOctave) {
    if (notes.length < 4) return createCloseVoicing(notes, baseOctave);
    
    const voiced = createCloseVoicing(notes, baseOctave + 1);
    voiced[voiced.length - 3].octave = baseOctave;
    return voiced;
}

/**
 * Creates a complete voicing with frequencies
 * @param {string[]} notes - Notes to voice
 * @param {Object} options - Voicing options
 * @returns {Array<{note: string, octave: number, frequency: number}>} Complete voicing
 */
export function createVoicing(notes, options = {}) {
    const {
        type = VOICING_TYPES.CLOSE,
        baseOctave = 3,
        bassNote = notes[0]
    } = options;

    // Reorder notes to put bass note first if specified
    const voicingNotes = bassNote !== notes[0] 
        ? [bassNote, ...notes.filter(n => n !== bassNote)]
        : [...notes];

    // Create voicing based on type
    let voiced;
    switch (type) {
        case VOICING_TYPES.OPEN:
            voiced = createOpenVoicing(voicingNotes, baseOctave);
            break;
        case VOICING_TYPES.DROP_2:
            voiced = createDrop2Voicing(voicingNotes, baseOctave);
            break;
        case VOICING_TYPES.DROP_3:
            voiced = createDrop3Voicing(voicingNotes, baseOctave);
            break;
        default:
            voiced = createCloseVoicing(voicingNotes, baseOctave);
    }

    // Add frequencies
    return voiced.map(({ note, octave }) => ({
        note,
        octave,
        frequency: noteToFrequency(note, octave)
    }));
}

/**
 * Creates a chord voicing (backwards compatibility function)
 * @param {string} chord - Chord symbol
 * @param {boolean} playFullChord - Whether to play full chord or just root
 * @returns {Array<{note: string, octave: number, frequency: number}>} Voiced chord
 */
export function createChordVoicing(chord, playFullChord = true) {
    const parsed = parseChordSymbol(chord);
    if (!parsed) return [];

    const { root, type, bassNote } = parsed;

    if (!playFullChord) {
        // For non-full chord mode, play the bass note if it's an inversion, otherwise the root
        const noteToPlay = bassNote || root;
        return [{
            note: noteToPlay,
            octave: 4,
            frequency: noteToFrequency(noteToPlay, 4)
        }];
    }

    // Get the chord notes
    const chordNotes = getChordNotes(root, type);

    // Create the voicing using our new system
    return createVoicing(chordNotes, {
        type: VOICING_TYPES.CLOSE,
        baseOctave: 3,
        bassNote: bassNote || root
    });
}

export { VOICING_TYPES };