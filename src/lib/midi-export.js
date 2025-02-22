// src/lib/midi-export.js
import { createChordVoicing } from './voicings';

function numberToVariableLengthQuantity(num) {
    if (num === 0) return [0];
    
    const bytes = [];
    let value = num;
    
    while (value > 0) {
        let byte = value & 0x7F;
        value = value >> 7;
        if (bytes.length > 0) byte |= 0x80;
        bytes.unshift(byte);
    }
    
    return bytes;
}

export function exportToMidi(progression) {
    // Constants
    const HEADER_CHUNK_TYPE = [0x4D, 0x54, 0x68, 0x64];  // "MThd"
    const TRACK_CHUNK_TYPE = [0x4D, 0x54, 0x72, 0x6B];   // "MTrk"
    const FORMAT = 0;                    // Format 0: single track
    const NUM_TRACKS = 1;                // One track
    const TICKS_PER_BEAT = 480;         // Standard PPQN
    const BEATS_PER_CHORD = 2;          // Each chord lasts 2 beats
    const NOTE_VELOCITY = 100;           // Standard velocity for notes
    const END_OF_TRACK = [0x00, 0xFF, 0x2F, 0x00];

    // Build header chunk
    const headerData = [
        ...HEADER_CHUNK_TYPE,           // Chunk type
        0x00, 0x00, 0x00, 0x06,        // Chunk length (always 6)
        0x00, FORMAT,                   // Format
        0x00, NUM_TRACKS,              // Number of tracks
        (TICKS_PER_BEAT >> 8) & 0xFF,  // Division (ticks per quarter note)
        TICKS_PER_BEAT & 0xFF
    ];

    // Build track events
    const trackEvents = [];

    // Process each chord
    progression.forEach((chord, chordIndex) => {
        const voicing = createChordVoicing(chord, true);
        
        // Note ON for all notes in the chord (simultaneously)
        voicing.forEach(({ frequency }, noteIndex) => {
            const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
            
            // Delta time (0 for all notes in chord - they start together)
            if (noteIndex === 0 && chordIndex === 0) {
                // First note of first chord
                trackEvents.push(0x00);
            } else if (noteIndex === 0) {
                // First note of subsequent chords
                trackEvents.push(0x00);
            } else {
                // Other notes in chord
                trackEvents.push(0x00);
            }
            
            // Note ON message
            trackEvents.push(0x90);  // Note ON, channel 0
            trackEvents.push(midiNote);
            trackEvents.push(NOTE_VELOCITY);
        });

        // Note OFF for all notes after TICKS_PER_BEAT * 2 ticks (two beats)
        voicing.forEach(({ frequency }, noteIndex) => {
            const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
            
            // Delta time - two beats for first note, 0 for others
            if (noteIndex === 0) {
                trackEvents.push(...numberToVariableLengthQuantity(TICKS_PER_BEAT * BEATS_PER_CHORD));
            } else {
                trackEvents.push(0x00);
            }
            
            // Note OFF message
            trackEvents.push(0x80);  // Note OFF, channel 0
            trackEvents.push(midiNote);
            trackEvents.push(0x00);  // Release velocity
        });
    });

    // Add End of Track
    trackEvents.push(...END_OF_TRACK);

    // Build track chunk
    const trackData = [
        ...TRACK_CHUNK_TYPE,
        // Track length (4 bytes)
        (trackEvents.length >> 24) & 0xFF,
        (trackEvents.length >> 16) & 0xFF,
        (trackEvents.length >> 8) & 0xFF,
        trackEvents.length & 0xFF,
        ...trackEvents
    ];

    // Combine into final MIDI file
    const midiData = new Uint8Array([...headerData, ...trackData]);
    return new Blob([midiData], { type: 'audio/midi' });
}

export function downloadMidi(progression, filename = 'progression.mid') {
    const midiBlob = exportToMidi(progression);
    const url = URL.createObjectURL(midiBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}