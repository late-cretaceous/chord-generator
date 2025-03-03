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
    this.playbackMode = 'chord'; // Default to chord mode, can be 'chord' or 'arpeggio'
    this.tempoScaleFactor = 2; // Play chords half speed (every other beat)
    this.lastTempo = 120; // Track the last used tempo
  }

  /**
   * Initialize audio context and synth engine
   * @returns {boolean} Whether initialization was successful
   */
  init() {
    try {
      // Create audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      
      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      
      // Create synth engine if it doesn't exist
      if (!this.synthEngine && this.audioContext) {
        this.synthEngine = new SynthEngine(this.audioContext);
      }
      
      return this.audioContext && this.synthEngine;
    } catch (e) {
      console.error("Failed to initialize audio engine:", e);
      return false;
    }
  }

  /**
   * Set the playback mode (chord or arpeggio)
   * @param {string} mode - Playback mode ('chord' or 'arpeggio')
   */
  setPlaybackMode(mode) {
    if (mode === 'chord' || mode === 'arpeggio') {
      this.playbackMode = mode;
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
    
    // Ensure synthEngine is initialized before attempting to use it
    if (!this.synthEngine) {
      console.warn("Synth engine not initialized, initializing now");
      this.init();
      
      // If still not initialized, exit to prevent errors
      if (!this.synthEngine) {
        console.error("Failed to initialize synth engine");
        return;
      }
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
    
    // If playing full chord, use specialized method based on playback mode
    if (playFullChord && frequencies.length > 1) {
      if (this.playbackMode === 'arpeggio') {
        this.playArpeggiated(frequencies, sortedNotes);
      } else {
        // Play as slightly staggered chord (original behavior)
        this.playVoicedChord(frequencies, sortedNotes);
      }
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
   * Play a chord as a pronounced arpeggio
   * @param {Array} frequencies - Frequencies to play
   * @param {Array} originalNotes - Original note strings for reference
   */
  playArpeggiated(frequencies, originalNotes) {
    if (!frequencies || frequencies.length === 0) return;
    
    // Ensure synthEngine is initialized before attempting to use it
    if (!this.synthEngine) {
      console.warn("Synth engine not initialized for arpeggio, initializing now");
      const initialized = this.init();
      if (!initialized) {
        console.error("Failed to initialize synth engine for arpeggio");
        return;
      }
    }
    
    // Create sequence of notes to play
    let notesToPlay = [...frequencies];
    
    // For triads, create a 4-note pattern by going up and then back to the middle note
    if (frequencies.length === 3) {
      // Add the middle note to create up-down pattern: [low, mid, high, mid]
      notesToPlay = [frequencies[0], frequencies[1], frequencies[2], frequencies[1]];
    }
    
    // Calculate exact timing for each 16th note division
    // A quarter note at 120 BPM is 500ms
    const quarterNoteDuration = (60 / (this.lastTempo || 120)) * 1000;
    
    // At half speed (tempoScaleFactor=2), each chord gets 2 quarter notes = 1000ms at 120bpm
    // Divide this into exactly 4 equal portions for 16th notes
    const totalDuration = quarterNoteDuration * this.tempoScaleFactor;
    const sixteenthNoteDuration = totalDuration / 4;
    
    // Initialize timer array if not already done
    if (!this.arpTimers) {
      this.arpTimers = [];
    } else {
      // Clear any pending timers
      this.arpTimers.forEach(timer => clearTimeout(timer));
      this.arpTimers = [];
    }
    
    // Play each note at exact 16th note intervals
    const noteDuration = 0.8 * sixteenthNoteDuration; // Slightly shorter than the interval
    
    // Play each note with exact timing
    notesToPlay.forEach((freq, index) => {
      // Calculate delay - place exactly on 16th note divisions
      const delay = index * sixteenthNoteDuration;
      
      // Schedule note start
      const playTimer = setTimeout(() => {
        if (!this.isPlaying || !this.synthEngine) return;
        
        try {
          // Velocity curve for expression
          let velocity;
          if (frequencies.length === 3 && index === 3) {
            // The returning middle note is a bit softer
            velocity = 0.42;
          } else {
            velocity = 0.5 - (index * 0.03);
          }
          
          // Play the note
          this.synthEngine.playNote(freq, velocity >= 0.3);
        } catch (e) {
          console.error("Error playing arpeggio note:", e);
        }
      }, delay);
      
      this.arpTimers.push(playTimer);
      
      // Schedule note stop (except for the last note)
      if (index < notesToPlay.length - 1) {
        const stopTimer = setTimeout(() => {
          if (!this.isPlaying) return;
          
          try {
            // Stop this note just before the next one starts
            this.synthEngine.stopNote(freq);
          } catch (e) {
            console.error("Error stopping arpeggio note:", e);
          }
        }, delay + noteDuration);
        
        this.arpTimers.push(stopTimer);
      }
    });
  }

  /**
   * Starts progression playback with support for variable chord durations
   * @param {Array} chords - Array of chord objects with notes and durations
   * @param {boolean} playFullChords - Whether to play full chords or just bass notes
   * @param {number} tempo - Tempo in BPM
   * @param {string} mode - Playback mode ('chord' or 'arpeggio')
   * @returns {boolean} Whether playback was successfully started
   */
  startProgressionPlayback(chords, playFullChords = false, tempo = 120, mode = null) {
    // Initialize audio engine
    const initialized = this.init();
    if (!initialized) {
      console.error("Failed to initialize audio engine");
      return false;
    }
    
    // Stop any current playback
    this.stopProgressionPlayback();
    
    // Set playback mode if provided
    if (mode) {
      this.setPlaybackMode(mode);
    }
    
    // Store the current tempo for arpeggiation speed calculation
    this.lastTempo = tempo;
    
    // Resume audio context if needed
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentChordIndex = 0;
    this.scheduledChords = [];
    this.nextNoteTime = this.audioContext.currentTime;
    
    // Verify we have a valid progression
    if (!chords || !Array.isArray(chords) || chords.length === 0) {
      console.warn("No valid progression provided");
      this.isPlaying = false;
      return false;
    }
    
    // Calculate base beat duration in seconds with scaling factor
    // Apply tempo scale factor to play chords at half speed
    const beatDuration = (60 / tempo) * this.tempoScaleFactor;
    
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
      try {
        this.playChord(this.chordSequence[0].notes, playFullChords);
      } catch (e) {
        console.error("Error playing first chord:", e);
        // Continue scheduler anyway, it will try to play subsequent chords
      }
    }
    
    return true;
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
    
    // Clear any scheduled lookahead timer
    if (this.lookaheadTimer) {
      clearInterval(this.lookaheadTimer);
      this.lookaheadTimer = null;
    }
    
    // Clear all pending arpeggio timers
    if (this.arpTimers && this.arpTimers.length > 0) {
      this.arpTimers.forEach(timer => clearTimeout(timer));
      this.arpTimers = [];
    }
    
    // Clear any scheduled chords
    this.scheduledChords = [];
    this.currentChordIndex = 0;
    
    // Check if synthEngine exists before trying to stop notes
    if (!this.synthEngine) {
      // If we get here without a synth engine, we don't need to stop any notes
      // but we should ensure we're properly initialized for next time
      if (this.audioContext && this.audioContext.state !== "closed") {
        this.init();
      }
      return;
    }
    
    // Immediately stop all audio
    try {
      // Use immediate mode (true) to stop notes with very short release
      this.synthEngine.stopAllNotes(true);
    } catch (e) {
      console.error("Error stopping notes:", e);
      // Re-initialize if we had an error
      this.init();
    }
  }

  /**
   * Sets the synth preset
   * @param {string} preset - Preset name to use
   * @public Method for UI components
   */
  setPreset(preset) {
    // Make sure synthEngine is initialized
    if (!this.synthEngine) {
      this.init();
      if (!this.synthEngine) {
        console.error("Failed to initialize synth engine when setting preset");
        return;
      }
    }
    this.synthEngine.setPreset(preset);
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
    this.synthEngine = null;
  }
}

// Export a singleton instance
export const audioEngine = new AudioEngine();