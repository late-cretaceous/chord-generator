// src/lib/audio.js
import { NOTES } from './core';
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

    playChord(chord, playFullChord = false, duration = 0.8) {
        if (!this.audioContext) this.init();
        
        if (!playFullChord) {
            // Just play the root note
            const rootNote = chord.replace(/m|dim|aug|maj7|7|sus[24]/g, '');
            const frequency = this.noteToFrequency(rootNote, 4);
            if (frequency) this.synthEngine.playNote(frequency);
            return;
        }
        
        const parsedChord = this.parseChord(chord);
        if (!parsedChord) return;
        
        const { root, type } = parsedChord;
        const chordNotes = this.getChordNotes(root, type);
        
        const baseOctave = 3;
        const rootIndex = NOTES.indexOf(root);
        
        chordNotes.forEach((note, index) => {
            const noteIndex = NOTES.indexOf(note);
            let noteOctave = baseOctave;
            
            if (noteIndex < rootIndex && index > 0) {
                noteOctave += 1;
            }
            
            const frequency = this.noteToFrequency(note, noteOctave);
            if (frequency) this.synthEngine.playNote(frequency);
        });
    }

    parseChord(chordSymbol) {
        // Keep existing parse chord implementation
        const rootPattern = /^[A-G][#]?/;
        const rootMatch = chordSymbol.match(rootPattern);
        
        if (!rootMatch) return null;
        
        const rootNote = rootMatch[0];
        const chordType = chordSymbol.slice(rootNote.length) || 'major';
        
        const chordTypeMap = {
            '': 'major',
            'm': 'minor',
            'min': 'minor',
            'maj': 'major',
            'dim': 'diminished',
            'aug': 'augmented'
        };
        
        return { 
            root: rootNote, 
            type: chordTypeMap[chordType] || 'major' 
        };
    }

    getChordNotes(rootNote, chordType) {
        // Keep existing getChordNotes implementation
        return [rootNote]; // Simplified for debugging
    }

    startProgressionPlayback(chords, playFullChords = false, tempo = 120) {
        if (!this.audioContext) this.init();
        
        this.stopProgressionPlayback();
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.currentChordIndex = 0;
        const intervalTime = (60 / tempo) * 1000;

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
        
        // Immediately stop all sounds
        if (this.synthEngine) {
            this.synthEngine.stopAllNotes(true);
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