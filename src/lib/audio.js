// src/lib/audio.js
import { CHORD_INTERVALS, NOTES } from './core';

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
        const noteIndex = NOTES.indexOf(note);
        
        if (noteIndex === -1) return null;
        
        const a4 = 440;
        const noteNumber = (octave - 4) * 12 + noteIndex - 9;
        return a4 * Math.pow(2, noteNumber / 12);
    }

    playNote(note, octave, duration = 1, velocity = 0.3) {
        if (!this.audioContext) this.init();

        const frequency = this.noteToFrequency(note, octave);
        if (!frequency) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(velocity, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);

        const id = `${note}${octave}-${this.audioContext.currentTime}`;
        this.oscillators.set(id, { oscillator, gainNode });

        setTimeout(() => {
            this.oscillators.delete(id);
        }, duration * 1000);
    }

    parseChord(chordSymbol) {
        // Parse the root note and chord type from the chord symbol
        const rootPattern = /^[A-G][#]?/;
        const rootMatch = chordSymbol.match(rootPattern);
        
        if (!rootMatch) return null;
        
        const rootNote = rootMatch[0];
        const chordType = chordSymbol.slice(rootNote.length) || 'major';
        
        // Map common chord symbols to our internal chord types
        const chordTypeMap = {
            '': 'major',
            'm': 'minor',
            'min': 'minor',
            'maj': 'major',
            'dim': 'diminished',
            'aug': 'augmented',
            '7': 'dominant7',
            'maj7': 'major7',
            'm7': 'minor7',
            'dim7': 'diminished7',
            '9': 'dominant9',
            'maj9': 'major9',
            'm9': 'minor9',
            'add9': 'add2',
            '6': 'major6',
            'm6': 'minor6',
            'sus2': 'sus2',
            'sus4': 'sus4'
        };
        
        const mappedType = chordTypeMap[chordType] || 'major';
        return { root: rootNote, type: mappedType };
    }
    
    getChordNotes(rootNote, chordType) {
        const rootIndex = NOTES.indexOf(rootNote);
        if (rootIndex === -1) {
            console.error('Invalid root note:', rootNote);
            return [];
        }
        
        const intervals = CHORD_INTERVALS[chordType];
        if (!intervals) {
            console.error('Invalid chord type:', chordType);
            return [rootNote]; // Return just the root note as fallback
        }
        
        return intervals.map(interval => {
            const noteIndex = (rootIndex + interval) % 12;
            return NOTES[noteIndex];
        });
    }

    playChord(chord, playFullChord = false, duration = 0.8) {
        if (!this.audioContext) this.init();
        
        if (!playFullChord) {
            // Just play the root note if full chord playback is disabled
            const rootNote = chord.replace(/m|dim|aug|maj7|7|sus[24]/g, '');
            this.playNote(rootNote, 4, duration);
            return;
        }
        
        const parsedChord = this.parseChord(chord);
        if (!parsedChord) {
            console.error('Could not parse chord:', chord);
            return;
        }
        
        const { root, type } = parsedChord;
        const chordNotes = this.getChordNotes(root, type);
        
        if (chordNotes.length === 0) {
            console.error('Could not get notes for chord:', chord);
            this.playNote(root, 4, duration); // Fallback to root note
            return;
        }
        
        // Play the chord notes in root position with clear stacking in thirds
        const baseOctave = 3; // Root note starts in a lower octave
        
        chordNotes.forEach((note, index) => {
            // Stack all chords in root position
            // Root note stays in base octave, subsequent notes stack upward
            let noteOctave = baseOctave + Math.floor(index / 3);
            
            // Ensure root is always the lowest note
            if (index === 0) {
                noteOctave = baseOctave;  // Root note stays in base octave
            }
            
            // Adjust velocities for balanced root position voicing
            let velocity;
            if (index === 0) velocity = 0.30; // Root note slightly stronger
            else if (index === 1) velocity = 0.23; // Third
            else velocity = 0.20; // Fifth and any extensions
            
            // Slight delay for a subtle arpeggiated effect
            const delay = index * 0.015;
            setTimeout(() => {
                this.playNote(note, noteOctave, duration - 0.05, velocity);
            }, delay * 1000);
        });
    }

    startProgressionPlayback(chords, playFullChords = false, tempo = 120) {
        if (!this.audioContext) this.init();
        
        // Stop any current playback first
        this.stopProgressionPlayback();
        
        // Resume audio context if it was suspended (needed for some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isPlaying = true;
        this.currentChordIndex = 0;
        const intervalTime = (60 / tempo) * 1000; // Convert tempo to milliseconds

        // Play the first chord immediately with a short delay to ensure audio context is resumed
        setTimeout(() => {
            if (this.isPlaying && chords.length > 0) {
                this.playChord(chords[this.currentChordIndex], playFullChords);
            }
        }, 50);

        // Set up interval for remaining chords
        this.playbackInterval = setInterval(() => {
            if (!this.isPlaying) {
                clearInterval(this.playbackInterval);
                return;
            }
            
            this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
            if (chords[this.currentChordIndex]) {
                this.playChord(chords[this.currentChordIndex], playFullChords);
            }
        }, intervalTime);
        
        return true;
    }

    stopProgressionPlayback() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        this.currentChordIndex = 0;
        
        // Immediately stop all currently playing sounds for a clean cut
        const now = this.audioContext ? this.audioContext.currentTime : 0;
        this.oscillators.forEach(({ gainNode }) => {
            if (gainNode) {
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
            }
        });
        
        // Clear all oscillators after a short delay
        setTimeout(() => {
            this.oscillators.clear();
        }, 100);
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