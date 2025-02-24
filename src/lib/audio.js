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
  console.log(
    `Note: ${noteWithOctave}, MIDI: ${noteNumber}, Frequency: ${frequency}`
  );
  return frequency;
}

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
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.synthEngine = new SynthEngine(this.audioContext);
    }
  }

  playChord(pitches, playFullChord = false, duration = 0.8) {
    if (!this.audioContext) this.init();
    const notesToPlay = playFullChord ? pitches : [pitches[0]];
    console.log("Playing chord:", notesToPlay);
    notesToPlay.forEach((pitch, index) => {
      const frequency = noteToFrequency(pitch);
      if (frequency) {
        // Back to raw frequency until SynthEngine is updated
        this.synthEngine.playNote(frequency);
      }
    });
  }

  startProgressionPlayback(chords, playFullChords = false, tempo = 120) {
    if (!this.audioContext) this.init();
    this.stopProgressionPlayback();
    if (this.audioContext.state === "suspended") this.audioContext.resume();

    this.isPlaying = true;
    this.currentChordIndex = 0;
    const intervalTime = (60 / tempo) * 2 * 1000;

    if (chords.length > 0) {
      this.playChord(chords[0], playFullChords);
    }

    this.playbackInterval = setInterval(() => {
      if (!this.isPlaying) {
        clearInterval(this.playbackInterval);
        return;
      }
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
    if (this.synthEngine) this.synthEngine.stopAllNotes(true);
  }

  setPreset(preset) {
    if (this.synthEngine) this.synthEngine.setPreset(preset);
  }

  dispose() {
    this.stopProgressionPlayback();
    if (this.synthEngine) this.synthEngine.dispose();
    if (this.audioContext) this.audioContext.close();
    this.audioContext = null;
  }
}

export const audioEngine = new AudioEngine();
