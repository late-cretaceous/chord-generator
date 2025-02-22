// src/lib/audio.js
import { createChordVoicing } from './voicings';
import { SynthEngine } from './synth/SynthEngine';

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.synthEngine = null;
        this.isPlaying = false;
        this.currentChordIndex = 0;
        this.playbackInterval = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.synthEngine = new SynthEngine(this.audioContext);
        }
    }

    playChord(chord, playFullChord = false, duration = 0.8) {
        if (!this.audioContext) this.init();
        
        // Use the voicing module to get the notes to play
        const voicing = createChordVoicing(chord, playFullChord);
        
        // Play each note in the voicing
        voicing.forEach(({ frequency }) => {
            if (frequency) this.synthEngine.playNote(frequency);
        });
    }

    startProgressionPlayback(chords, playFullChords = false, tempo = 120) {
        if (!this.audioContext) this.init();
        
        this.stopProgressionPlayback();
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.currentChordIndex = 0;
        const intervalTime = (60 / tempo) * 2 * 1000;

        // Play first chord immediately
        if (chords.length > 0) {
            this.playChord(chords[0], playFullChords);
        }

        this.playbackInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.playbackInterval);
                return;
            }
            
            // Stop previous chord
            this.synthEngine.stopAllNotes();
            
            this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
            if (chords[this.currentChordIndex]) {
                this.playChord(chords[this.currentChordIndex], playFullChords);
            }
        }, intervalTime);
    }

    stopProgressionPlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        this.currentChordIndex = 0;
        
        if (this.synthEngine) {
            this.synthEngine.stopAllNotes(true);
        }
    }

    setPreset(preset) {
        if (this.synthEngine) {
            this.synthEngine.setPreset(preset);
        }
    }

    dispose() {
        this.stopProgressionPlayback();
        if (this.synthEngine) {
            this.synthEngine.dispose();
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

export const audioEngine = new AudioEngine();