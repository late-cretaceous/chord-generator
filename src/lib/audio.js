// src/lib/audio.js
import { NOTES, CHORD_INTERVALS } from './core';
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

    noteToFrequency(note, octave) {
        const noteIndex = NOTES.indexOf(note);
        if (noteIndex === -1) return null;
        
        const a4 = 440;
        const noteNumber = (octave - 4) * 12 + noteIndex - 9;
        return a4 * Math.pow(2, noteNumber / 12);
    }

    parseChord(chordSymbol) {
        // Parse chord symbol into root note and quality
        const rootPattern = /^[A-G][#]?/;
        const rootMatch = chordSymbol.match(rootPattern);
        
        if (!rootMatch) return null;
        
        const rootNote = rootMatch[0];
        let chordType = chordSymbol.slice(rootNote.length);
        
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
            type: chordTypeMap[chordType] || 'major'
        };
    }

    getChordNotes(rootNote, chordType) {
        const rootIndex = NOTES.indexOf(rootNote);
        if (rootIndex === -1) return [rootNote];
        
        const intervals = CHORD_INTERVALS[chordType];
        if (!intervals) return [rootNote];
        
        return intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return NOTES[noteIndex];
        });
    }

    playChord(chord, playFullChord = false, duration = 0.8) {
        if (!this.audioContext) this.init();
        
        const parsedChord = this.parseChord(chord);
        if (!parsedChord) return;
        
        const { root, type } = parsedChord;
        const chordNotes = this.getChordNotes(root, type);
        
        if (!playFullChord) {
            // Play just the root note at octave 4
            const frequency = this.noteToFrequency(root, 4);
            if (frequency) this.synthEngine.playNote(frequency);
            return;
        }
        
        // Play full chord with appropriate voicing
        const baseOctave = 3;
        const rootIndex = NOTES.indexOf(root);
        
        chordNotes.forEach((note, index) => {
            const noteIndex = NOTES.indexOf(note);
            let noteOctave = baseOctave;
            
            // Adjust octave to keep notes close together
            if (noteIndex < rootIndex && index > 0) {
                noteOctave += 1;
            }
            
            const frequency = this.noteToFrequency(note, noteOctave);
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