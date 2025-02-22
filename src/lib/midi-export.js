// src/lib/midi-export.js
import { createChordVoicing } from './voicings';

/**
 * Creates a MIDI header chunk
 * @param {number} format - MIDI format (0 = single track, 1 = multiple tracks)
 * @param {number} numTracks - Number of tracks
 * @param {number} division - Ticks per quarter note
 * @returns {Uint8Array} MIDI header chunk
 */
function createMidiHeader(format = 1, numTracks = 2, division = 480) {
    return new Uint8Array([
        0x4D, 0x54, 0x68, 0x64, // MThd
        0x00, 0x00, 0x00, 0x06, // Chunk size (always 6)
        (format >> 8) & 0xFF, format & 0xFF, // Format
        (numTracks >> 8) & 0xFF, numTracks & 0xFF, // Number of tracks
        (division >> 8) & 0xFF, division & 0xFF // Ticks per quarter note
    ]);
}

/**
 * Creates a variable-length quantity (VLQ) value used in MIDI
 * @param {number} value - Number to convert to VLQ
 * @returns {number[]} Array of bytes representing the VLQ
 */
function createVLQ(value) {
    if (value < 0) return [0];
    
    const bytes = [];
    let v = value;
    
    do {
        let b = v & 0x7F;
        v = v >> 7;
        if (v > 0) b = b | 0x80;
        bytes.push(b);
    } while (v > 0);
    
    return bytes;
}

/**
 * Creates a track chunk for tempo and time signature
 * @param {number} tempo - Tempo in BPM
 * @returns {Uint8Array} MIDI track chunk
 */
function createTempoTrack(tempo = 120) {
    const microsecondsPerBeat = Math.floor(60000000 / tempo);
    
    const events = [
        // Tempo meta event
        0x00, 0xFF, 0x51, 0x03,
        (microsecondsPerBeat >> 16) & 0xFF,
        (microsecondsPerBeat >> 8) & 0xFF,
        microsecondsPerBeat & 0xFF,
        
        // Time signature meta event (4/4 time)
        0x00, 0xFF, 0x58, 0x04,
        0x04, 0x02, 0x18, 0x08,
        
        // End of track
        0x00, 0xFF, 0x2F, 0x00
    ];
    
    const trackLength = events.length;
    return new Uint8Array([
        0x4D, 0x54, 0x72, 0x6B,
        (trackLength >> 24) & 0xFF,
        (trackLength >> 16) & 0xFF,
        (trackLength >> 8) & 0xFF,
        trackLength & 0xFF,
        ...events
    ]);
}

/**
 * Creates a track chunk containing the chord progression
 * @param {Array} progression - Array of chord symbols
 * @param {number} ticksPerBeat - MIDI ticks per quarter note
 * @returns {Uint8Array} MIDI track chunk
 */
function createChordTrack(progression, ticksPerBeat = 480) {
    const events = [];
    const beatsPerChord = 2;
    const velocity = 80;
    
    let currentTick = 0;
    let previousVoicing = null;

    progression.forEach((chord) => {
        const currentVoicing = createChordVoicing(chord, true);
        
        // First, turn off all previous notes together
        if (previousVoicing) {
            // Calculate delta from last note-on to this note-off
            const deltaTime = ticksPerBeat * beatsPerChord;
            events.push(...createVLQ(deltaTime));
            
            // Turn off all notes with zero delta between them
            previousVoicing.forEach(({ frequency }, index) => {
                const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
                if (index > 0) {
                    events.push(...createVLQ(0));
                }
                events.push(0x80, midiNote, 0x00);
            });
        }
        
        // Then turn on all new notes together
        currentVoicing.forEach(({ frequency }, index) => {
            const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
            if (index === 0 && !previousVoicing) {
                // First chord starts immediately
                events.push(...createVLQ(0));
            } else if (index === 0) {
                // Subsequent chords start immediately after note-offs
                events.push(...createVLQ(0));
            } else {
                // All other notes in the same chord start together
                events.push(...createVLQ(0));
            }
            events.push(0x90, midiNote, velocity);
        });
        
        previousVoicing = currentVoicing;
    });
    
    // Turn off the final chord notes together
    if (previousVoicing) {
        events.push(
            ...createVLQ(ticksPerBeat * beatsPerChord)
        );
        previousVoicing.forEach(({ frequency }, index) => {
            const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
            if (index > 0) {
                events.push(...createVLQ(0));
            }
            events.push(0x80, midiNote, 0x00);
        });
    }
    
    // End of track
    events.push(0x00, 0xFF, 0x2F, 0x00);
    
    const trackLength = events.length;
    return new Uint8Array([
        0x4D, 0x54, 0x72, 0x6B,
        (trackLength >> 24) & 0xFF,
        (trackLength >> 16) & 0xFF,
        (trackLength >> 8) & 0xFF,
        trackLength & 0xFF,
        ...events
    ]);
}

/**
 * Exports a chord progression as a MIDI file
 * @param {Array} progression - Array of chord symbols
 * @param {Object} options - Export options (tempo, etc.)
 * @returns {Blob} MIDI file as a Blob
 */
export function exportToMidi(progression, { tempo = 120 } = {}) {
    const header = createMidiHeader();
    const tempoTrack = createTempoTrack(tempo);
    const chordTrack = createChordTrack(progression);
    
    return new Blob([header, tempoTrack, chordTrack], { type: 'audio/midi' });
}

/**
 * Triggers download of MIDI file in the browser
 * @param {Array} progression - Array of chord symbols
 * @param {string} filename - Name for the downloaded file
 * @param {Object} options - Export options (tempo, etc.)
 */
export function downloadMidi(progression, filename = 'progression.mid', options = {}) {
    const midiBlob = exportToMidi(progression, options);
    const url = URL.createObjectURL(midiBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}