// src/lib/voicings.js
import { NOTES, CHORD_INTERVALS } from './core';

/**
 * Gets the frequency for a note at a specific octave
 * @param {string} note - The note name (e.g., 'C', 'F#')
 * @param {number} octave - The octave number
 * @returns {number} The frequency in Hz
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
export function parseChord(chordSymbol) {
    // Check for slash chord notation (inversions)
    const slashParts = chordSymbol.split('/');
    const mainChord = slashParts[0];
    const bassNote = slashParts[1]; // Will be undefined if no slash
    
    // Parse main chord symbol into root note and quality
    const rootPattern = /^[A-G][#]?/;
    const rootMatch = mainChord.match(rootPattern);
    
    if (!rootMatch) return null;
    
    const rootNote = rootMatch[0];
    let chordType = mainChord.slice(rootNote.length);
    
    // Map chord symbols to quality
    const chordTypeMap = {
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
        type: chordTypeMap[chordType] || 'major',
        bassNote: bassNote // This will be undefined for non-inverted chords
    };
}

/**
 * Gets the notes for a chord
 * @param {string} rootNote - The root note
 * @param {string} chordType - The chord type
 * @returns {string[]} Array of note names
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
 * Creates a voicing for a chord, determining notes and octaves to play
 * @param {string} chord - The chord symbol
 * @param {boolean} playFullChord - Whether to play the full chord or just the bass note
 * @returns {Array} Array of note objects with note name, octave, and frequency
 */
export function createChordVoicing(chord, playFullChord = true) {
    const parsedChord = parseChord(chord);
    if (!parsedChord) return [];
    
    const { root, type, bassNote } = parsedChord;
    const chordNotes = getChordNotes(root, type);
    
    if (!playFullChord) {
        // For non-full chord mode, play the bass note if it's an inversion, otherwise the root
        const noteToPlay = bassNote || root;
        const frequency = noteToFrequency(noteToPlay, 4);
        return [{ note: noteToPlay, octave: 4, frequency }].filter(n => n.frequency);
    }
    
    // Play full chord with appropriate voicing
    const baseOctave = 3;
    const rootIndex = NOTES.indexOf(root);
    const voicing = [];
    
    // If there's a specified bass note (slash chord), handle it differently
    if (bassNote) {
        // Add the bass note first
        voicing.push({
            note: bassNote,
            octave: baseOctave,
            frequency: noteToFrequency(bassNote, baseOctave)
        });
        
        // Then add the rest of the chord notes, excluding any that match the bass
        chordNotes.forEach((note) => {
            if (note !== bassNote) {
                const noteOctave = baseOctave + 1; // Play upper notes an octave higher
                voicing.push({
                    note,
                    octave: noteOctave,
                    frequency: noteToFrequency(note, noteOctave)
                });
            }
        });
    } else {
        // Regular (non-inverted) chord handling
        chordNotes.forEach((note, index) => {
            const noteIndex = NOTES.indexOf(note);
            let noteOctave = baseOctave;
            
            // Adjust octave to keep notes close together
            if (noteIndex < rootIndex && index > 0) {
                noteOctave += 1;
            }
            
            voicing.push({
                note,
                octave: noteOctave,
                frequency: noteToFrequency(note, noteOctave)
            });
        });
    }
    
    return voicing.filter(n => n.frequency); // Filter out any notes with invalid frequencies
}