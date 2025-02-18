// src/lib/audio.js

/** 
 * Audio Engine for synthesizing and playing musical notes and chords
 */
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = new Map();
    }

    init() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.5;
    }

    noteToFrequency(note, octave) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = notes.indexOf(note);
        
        if (noteIndex === -1) return null;
        
        const a4 = 440;
        const noteNumber = (octave - 4) * 12 + noteIndex - 9;
        return a4 * Math.pow(2, noteNumber / 12);
    }

    playNote(note, octave, duration = 1) {
        if (!this.audioContext) this.init();

        const frequency = this.noteToFrequency(note, octave);
        if (!frequency) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);

        const id = `${note}${octave}`;
        this.oscillators.set(id, { oscillator, gainNode });

        setTimeout(() => {
            this.oscillators.delete(id);
        }, duration * 1000);
    }

    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.oscillators.clear();
    }
}

// Export a singleton instance
export const audioEngine = new AudioEngine();

// We can add more audio-related functions here as we develop them
// For example:

/**
 * Get frequencies for a full chord
 * @param {string} chord - Chord symbol (e.g., 'Cm', 'F', 'G7')
 * @returns {Array} Array of frequencies for each note in the chord
 */
export function getChordFrequencies(chord) {
    // To be implemented
}

/**
 * Handle timing for sequential chord playback
 * @param {Array} chords - Array of chord symbols
 * @param {number} tempo - Tempo in BPM
 */
export function playChordSequence(chords, tempo) {
    // To be implemented
}
