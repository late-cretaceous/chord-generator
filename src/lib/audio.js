// src/lib/audio.js

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.oscillators = new Map();
        this.isPlaying = false;
        this.currentChordIndex = 0;
        this.playbackInterval = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.5;
        }
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

    playChord(chord) {
        // For now, just play the root note
        const note = chord.replace(/m|dim|aug|maj7|7/g, '');
        this.playNote(note, 4, 0.8); // Slightly shorter duration for rhythm
    }

    startProgressionPlayback(chords, tempo = 120) {
        if (!this.audioContext) this.init();
        
        this.isPlaying = true;
        this.currentChordIndex = 0;
        const intervalTime = (60 / tempo) * 1000; // Convert tempo to milliseconds

        // Play the first chord immediately
        this.playChord(chords[this.currentChordIndex]);

        // Set up interval for remaining chords
        this.playbackInterval = setInterval(() => {
            this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
            this.playChord(chords[this.currentChordIndex]);
        }, intervalTime);
    }

    stopProgressionPlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        this.currentChordIndex = 0;
    }

    dispose() {
        this.stopProgressionPlayback();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.oscillators.clear();
    }
}

export const audioEngine = new AudioEngine();