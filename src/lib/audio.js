// lib/audio.js
/**
 * @module audio
 * @domain Audio
 * @responsibility Manages audio playback of chord progressions
 * @public Can be used by UI components and other domain managers
 */

import { SynthEngine } from "./synth/SynthEngine";
import { NOTES } from "./core";

/**
 * Converts a note string to frequency in Hz
 * Uses the formula f = 440 * 2^((n-69)/12) where n is MIDI note number
 * @param {string} noteWithOctave - Note in format like "C4"
 * @returns {number|null} Frequency in Hz or null if invalid
 */
function noteToFrequency(noteWithOctave) {
  const match = noteWithOctave.match(/([A-G][#]?)([0-9])/);
  if (!match) return null;
  const [_, note, octave] = match;
  const noteIndex = NOTES.indexOf(note);
  if (noteIndex === -1) return null;
  const a4 = 440;
  const noteNumber = noteIndex + (parseInt(octave) + 2) * 12; // C2 = MIDI 48
  const a4Midi = 69;
  const frequency = a4 * Math.pow(2, (noteNumber - a4Midi) / 12);
  return frequency;
}

/**
 * Audio Engine class that manages sound generation and playback
 */
class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.synthEngine = null;
    this.isPlaying = false;
    this.currentChordIndex = 0;
    this.scheduledChords = [];
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 0.2; // Schedule 200ms ahead
    this.lookAhead = 30; // 30ms lookahead interval
    this.lookaheadTimer = null;
  }

  /**
   * Initialize audio context and synth engine
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.synthEngine = new SynthEngine(this.audioContext);
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
  }

  /**
   * Play a chord with improved voice handling
   * @param {Array} pitches - Array of note strings (e.g. ["C3", "E3", "G3"])
   * @param {boolean} playFullChord - Whether to play full chord or just bass note
   * @param {number} velocity - Volume level (0-1)
   */
  playChord(pitches, playFullChord = false, velocity = 0.3) {
    if (!this.audioContext) this.init();
    
    // Make sure audio context is running
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    
    // First stop any currently playing notes
    this.synthEngine.stopAllNotes();
    
    // Determine which notes to play
    const notesToPlay = playFullChord ? pitches : [pitches[0]];
    
    // Sort notes by pitch for better analysis
    const sortedNotes = [...notesToPlay].sort((a, b) => {
      const aMatch = a.match(/([A-G][#]?)([0-9])/);
      const bMatch = b.match(/([A-G][#]?)([0-9])/);
      if (!aMatch || !bMatch) return 0;
      
      const aOctave = parseInt(aMatch[2]);
      const bOctave = parseInt(bMatch[2]);
      
      // First compare octaves
      if (aOctave !== bOctave) return aOctave - bOctave;
      
      // Then compare notes within octave
      const aNote = aMatch[1];
      const bNote = bMatch[1];
      return NOTES.indexOf(aNote) - NOTES.indexOf(bNote);
    });
    
    // Convert notes to frequencies
    const frequencies = sortedNotes
      .map(pitch => noteToFrequency(pitch))
      .filter(freq => freq !== null);
    
    if (frequencies.length === 0) return;
    
    // If playing full chord, use specialized method
    if (playFullChord && frequencies.length > 1) {
      // Play chord with specialized treatment
      this.playVoicedChord(frequencies, sortedNotes);
    } else {
      // Just play individual notes (usually just the bass note)
      frequencies.forEach(frequency => {
        this.synthEngine.playNote(frequency);
      });
    }
  }
  
  /**
   * Play a chord with optimized voice balance
   * @param {Array} frequencies - Frequencies to play
   * @param {Array} originalNotes - Original note strings for reference
   */
  playVoicedChord(frequencies, originalNotes) {
    if (!frequencies || frequencies.length === 0) return;
    
    // Get the bass note (lowest frequency)
    const bassFreq = frequencies[0];
    
    // First play the bass with slight emphasis and delay
    this.synthEngine.playNote(bassFreq, true);
    
    // Play upper voices with staggered timing for clarity
    // This creates a subtle arpeggio effect that helps distinguish voices
    for (let i = 1; i < frequencies.length; i++) {
      const delay = i * 8; // 8ms delay per voice
      setTimeout(() => {
        this.synthEngine.playNote(frequencies[i], false);
      }, delay);
    }
  }

  /**
   * Starts progression playback with support for variable chord durations
   * @param {Array} chords - Array of chord objects with notes and durations
   * @param {boolean} playFullChords - Whether to play full chords or just bass notes
   * @param {number} tempo - Tempo in BPM
   */
  startProgressionPlayback(chords, playFullChords = false, tempo = 120) {
    if (!this.audioContext) this.init();
    this.stopProgressionPlayback();
    
    // Resume audio context if needed
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentChordIndex = 0;
    this.scheduledChords = [];
    this.nextNoteTime = this.audioContext.currentTime;
    
    // Calculate base beat duration in seconds
    const beatDuration = 60 / tempo;
    
    // Prepare chord sequence with normalized durations
    this.chordSequence = chords.map(chord => {
      const notesToPlay = playFullChords ? chord.notes : [chord.bass];
      const duration = chord.duration ? chord.duration * beatDuration : beatDuration * 2;
      
      return {
        notes: notesToPlay,
        duration: duration,
        playFullChord: playFullChords
      };
    });
    
    // Start the playback scheduler
    this.startScheduler();
    
    // Play the first chord immediately
    if (this.chordSequence.length > 0) {
      this.playChord(this.chordSequence[0].notes, playFullChords);
    }
  }
  
  /**
   * Schedules chord playback using a lookahead scheduler for timing accuracy
   * @private Internal method
   */
  startScheduler() {
    // Clear any existing timer
    if (this.lookaheadTimer) clearInterval(this.lookaheadTimer);
    
    // Start the scheduler loop
    this.lookaheadTimer = setInterval(() => {
      this.scheduleChords();
    }, this.lookAhead);
  }
  
  /**
   * Schedules upcoming chords for playback
   * @private Internal method
   */
  scheduleChords() {
    if (!this.isPlaying) {
      clearInterval(this.lookaheadTimer);
      return;
    }
    
    // Schedule notes up to the lookahead window
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      // Get the current chord to schedule
      const chord = this.chordSequence[this.currentChordIndex];
      if (!chord) return;
      
      // Schedule this chord
      this.scheduleChord(chord, this.nextNoteTime);
      
      // Advance time pointer by chord duration
      this.nextNoteTime += chord.duration;
      
      // Move to next chord
      this.currentChordIndex++;
      if (this.currentChordIndex >= this.chordSequence.length) {
        this.currentChordIndex = 0; // Loop back to start
      }
    }
  }
  
  /**
   * Schedules a single chord for playback at a specific time
   * @param {Object} chord - Chord to schedule
   * @param {number} time - Audiocontext time to schedule the chord
   * @private Internal method
   */
  scheduleChord(chord, time) {
    // Keep track of scheduled chords for potential cancellation
    this.scheduledChords.push({
      chord,
      time
    });
    
    // Use setTimeout for scheduling based on clock time difference
    const timeUntilChord = (time - this.audioContext.currentTime) * 1000;
    if (timeUntilChord < 0) {
      console.warn("Negative scheduling time, audio timing issues may occur");
    }
    
    setTimeout(() => {
      if (!this.isPlaying) return;
      
      // Play the chord using the improved method
      this.playChord(chord.notes, chord.playFullChord);
      
    }, Math.max(0, timeUntilChord));
  }

  /**
   * Stops the progression playback
   * @public Method for UI components
   */
  stopProgressionPlayback() {
    this.isPlaying = false;
    if (this.lookaheadTimer) {
      clearInterval(this.lookaheadTimer);
      this.lookaheadTimer = null;
    }
    this.scheduledChords = [];
    this.currentChordIndex = 0;
    if (this.synthEngine) this.synthEngine.stopAllNotes(true);
  }

  /**
   * Sets the synth preset
   * @param {string} preset - Preset name to use
   * @public Method for UI components
   */
  setPreset(preset) {
    if (this.synthEngine) this.synthEngine.setPreset(preset);
  }

  /**
   * Disposes of audio resources
   * @public Method for cleanup
   */
  dispose() {
    this.stopProgressionPlayback();
    if (this.synthEngine) this.synthEngine.dispose();
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
  }
}

// Export a singleton instance
export const audioEngine = new AudioEngine();