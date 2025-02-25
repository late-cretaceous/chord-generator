// lib/audio.js
/**
 * @module audio
 * @domain Audio
 * @responsibility Manages audio playback of chord progressions
 * @public Can be used by UI components and other domain managers
 */

import { SynthEngine } from "./synth/SynthEngine";
import { NOTES } from "./core";

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

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.synthEngine = null;
    this.isPlaying = false;
    this.currentChordIndex = 0;
    this.playbackInterval = null;
    this.scheduledChords = [];
    this.nextNoteTime = 0;
    this.scheduleAheadTime = 0.2; // Schedule 200ms ahead
    this.lookAhead = 30; // 30ms lookahead interval
    this.lookaheadTimer = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.synthEngine = new SynthEngine(this.audioContext);
    }
  }

  playChord(pitches, playFullChord = false, duration = 0.8) {
    if (!this.audioContext) this.init();
    const notesToPlay = playFullChord ? pitches : [pitches[0]];
    notesToPlay.forEach((pitch, index) => {
      const frequency = noteToFrequency(pitch);
      if (frequency) {
        this.synthEngine.playNote(frequency);
      }
    });
  }

  /**
   * Starts progression playback with support for variable chord durations
   * @domain Audio
   * @calledBy UI components or other domain managers
   * @param {Array} chords - Array of chord objects with notes and durations
   * @param {boolean} playFullChords - Whether to play full chords or just bass notes
   * @param {number} tempo - Tempo in BPM
   */
  startProgressionPlayback(chords, playFullChords = false, tempo = 120) {
    if (!this.audioContext) this.init();
    this.stopProgressionPlayback();
    if (this.audioContext.state === "suspended") this.audioContext.resume();

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
        isDrum: false,
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
   * @domain Audio
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
   * @domain Audio
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
   * @domain Audio
   * @private Internal method
   * @param {Object} chord - Chord to schedule
   * @param {number} time - Audiocontext time to schedule the chord
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
      
      // Stop any currently playing notes
      this.synthEngine.stopAllNotes();
      
      // Play the chord
      chord.notes.forEach(pitch => {
        const frequency = noteToFrequency(pitch);
        if (frequency) {
          this.synthEngine.playNote(frequency);
        }
      });
    }, Math.max(0, timeUntilChord));
  }

  /**
   * Stops the progression playback
   * @domain Audio
   * @calledBy UI components or other domain managers
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
   * @domain Audio
   * @calledBy UI components or other domain managers
   * @param {string} preset - Preset name to use
   */
  setPreset(preset) {
    if (this.synthEngine) this.synthEngine.setPreset(preset);
  }

  /**
   * Disposes of audio resources
   * @domain Audio
   * @calledBy UI components or other domain managers
   */
  dispose() {
    this.stopProgressionPlayback();
    if (this.synthEngine) this.synthEngine.dispose();
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
  }
}

export const audioEngine = new AudioEngine();