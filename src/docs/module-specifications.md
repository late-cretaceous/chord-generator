{\rtf1\ansi\ansicpg1252\cocoartf2821
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fnil\fcharset0 Menlo-Regular;}
{\colortbl;\red255\green255\blue255;\red0\green0\blue0;}
{\*\expandedcolortbl;;\cssrgb\c0\c0\c0;}
\margl1440\margr1440\vieww20000\viewh21700\viewkind0
\deftab720
\pard\pardeftab720\partightenfactor0

\f0\fs24 \cf2 \expnd0\expndtw0\kerning0
# Chord Progression App Specification\
\
---\
\
## Core Modules\
\
### core.js\
\
**Purpose:** Provides foundational music theory utilities and constants for generating scales, chords, and pitch conversions, serving as a reusable toolkit for other modules.\
\
**Inputs:** Varies by function: note names (strings), mode identifiers (strings/objects), scale degrees (numbers), chord types (strings), octaves (numbers).\
\
**Outputs:** Varies by function: arrays of pitch-specific notes (strings), chord symbols (strings), roman numerals (strings), MIDI numbers (numbers).\
\
**Behavior/Algorithm:** Supplies static data (e.g., `NOTES`, `CHORD_INTERVALS`) and functions for pitch manipulation, chord construction, and modal calculations. Stateless, functional\'97no playback or progression logic.\
\
**Dependencies:** None\'97relies on internal constants and JavaScript built-ins.\
\
**Constraints/Assumptions:** Assumes 12-tone equal temperament and Western notation (e.g., "C", "F#").\
\
**Non-Responsibilities/Limitations:** Does not manage chord progressions or inversions (handled by `logic.js`, `inversions.js`). Does not play audio or interact with playback systems (handled by `audio.js`).\
\
---\
\
### logic.js\
\
**Purpose:** Generates chord progressions based on musical parameters, producing pitch-specific chord objects with root positions and optional inversion hooks.\
\
**Inputs:**\
*   `length` (Number, optional, default: 4)\'97progression length.\
*   `key` (String, optional, default: "C")\'97tonic key.\
*   `modeName` (String/Object, optional, default: "ionian")\'97musical mode.\
*   `useInversions` (Boolean, optional, default: true)\'97toggle inversions.\
*   `rootOctave` (Number, optional, default: 2)\'97base octave for pitches.\
\
**Outputs:** Array of chord objects: `\{ root: string, quality: string, bass: string, notes: string[] \}`\'97e.g., `[\{ root: "C", quality: "", bass: "C2", notes: ["C2", "E2", "G2"] \}, ...]`.\
\
**Behavior/Algorithm:** Generates roman numeral progressions using mode transition probabilities (from `MODES`). Converts to pitch-specific chords with octave-aware notes via `core.js`. Optionally applies inversions via `inversions.js`.\
\
**Dependencies:**\
*   `core.js`: `calculateModalRoot`, `romanToChordSymbols`, `getNotesFromChordSymbol`, `parseChordSymbol`.\
*   `inversions.js`: `applyProgressionInversions`.\
*   `modes/*`: Mode definitions (`MODES`).\
\
**Constraints/Assumptions:** Assumes valid `key` and `modeName`\'97defaults to "C" and "ionian" if invalid. Relies on `inversions.js` for voicing adjustments.\
\
**Non-Responsibilities/Limitations:** Does not play audio or manage playback (handled by `audio.js`, `ProgressionPlayer.jsx`). Does not render UI or format chord symbols for display (handled by `ChordGenerator.jsx`).\
\
---\
\
### inversions.js\
\
**Purpose:** Optimizes a chord progression by applying inversions based on voice-leading principles, adjusting pitch-specific chord voicings.\
\
**Inputs:** `progression`: Array of chord objects\'97`\{ root: string, quality: string, bass: string, notes: string[] \}`.\
\
**Outputs:** Array of chord objects with updated `bass` and `notes`\'97e.g., `\{ root: "G", quality: "", bass: "D2", notes: ["D2", "G2", "B2"] \}`.\
\
**Behavior/Algorithm:** Reorders each chord\'92s `notes` to create inversion options within the same octave range. Selects the best inversion per chord based on voice-leading distance from the previous chord, favoring bass movement. Preserves pitch-specific notation (e.g., "D2")\'97no playback or frequency conversion.\
\
**Dependencies:** `core.js`: `NOTES`, `pitchToMidi`, `midiToPitch`, `parseChordSymbol`\'97for pitch manipulation.\
\
**Constraints/Assumptions:** Assumes input chords have valid `notes` arrays from `logic.js`. Uses a fixed base octave derived from input (e.g., 2).\
\
**Non-Responsibilities/Limitations:** Does not generate initial progressions (handled by `logic.js`). Does not play audio or calculate frequencies (handled by `audio.js`).\
\
---\
\
## Audio and UI Modules\
\
### audio.js\
\
**Purpose:** Translates pitch-specific note arrays into audio playback via a synthesizer, acting as a minimal bridge between progression data and sound output.\
\
**Inputs:**\
*   `pitches`: Array of pitch strings (e.g., `["D2", "G2", "B2"]`)\'97from `ProgressionPlayer.jsx`.\
*   `playFullChord`: Boolean\'97full chord vs. bass only.\
*   `duration`: Number (optional)\'97note duration in seconds.\
\
**Outputs:** None\'97produces audio output through `SynthEngine`.\
\
**Behavior/Algorithm:** Converts pitch strings (e.g., "C2") to frequencies using `noteToFrequency`. Plays frequencies via `SynthEngine`, sequencing chords for progressions. Manages playback state (start/stop).\
\
**Dependencies:**\
*   `core.js`: `NOTES`\'97for frequency calculation.\
*   `synth/SynthEngine.js`: `SynthEngine`\'97for audio synthesis.\
\
**Constraints/Assumptions:** Assumes pitches are valid strings (e.g., "C2")\'97no error correction beyond null checks. Relies on `SynthEngine` for actual sound generation.\
\
**Non-Responsibilities/Limitations:** Does not generate chords, inversions, or progressions (handled by `logic.js`, `inversions.js`). Does not reorder notes or apply musical logic\'97plays `notes` as provided.\
\
---\
\
### ProgressionPlayer.jsx\
\
**Purpose:** Renders a UI control panel for playing chord progressions, passing pitch-specific data to `audio.js` for playback.\
\
**Inputs:**\
*   `progression`: Array of chord objects\'97`\{ root: string, quality: string, bass: string, notes: string[] \}`\'97from `ChordGenerator.jsx`.\
*   `maintainPlayback`: Boolean (optional)\'97restart playback on progression change.\
*   `onTempoChange`: Function (optional)\'97callback for tempo updates.\
*   `tempo`: Number (optional)\'97current tempo in BPM.\
\
**Outputs:** React component\'97UI with play/pause, tempo, and chord mode controls. Triggers audio playback via `audio.js`.\
\
**Behavior/Algorithm:** Maps chord objects to pitch arrays (`notes` or `[bass]`) based on full/root mode. Controls playback via `audio.js`\'97start, stop, tempo adjustments. Updates UI state (playing, tempo, mode).\
\
**Dependencies:**\
*   `audio.js`: `audioEngine`\'97for playback control.\
*   `SynthControls.jsx`, `MidiExportButton.jsx`\'97child components.\
\
**Constraints/Assumptions:** Assumes `progression` contains valid chord objects\'97renders nothing if empty. Relies on external tempo and preset definitions.\
\
**Non-Responsibilities/Limitations:** Does not generate or modify chord progressions (handled by `logic.js`, `inversions.js`). Does not compute frequencies or manage audio synthesis (handled by `audio.js`, `SynthEngine.js`).}