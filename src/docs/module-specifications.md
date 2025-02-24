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
### logic.js

**Purpose:** Serves as the main coordinator module for the chord progression generation system, providing a unified API that connects specialized components to produce complete chord progressions with proper voicings.

**Inputs:**
* `length` (Number, optional, default: 4) — Desired progression length.
* `key` (String, optional, default: "C") — Tonic key.
* `modeName` (String/Object, optional, default: "ionian") — Musical mode.
* `useInversions` (Boolean, optional, default: true) — Toggle inversions.
* `rootOctave` (Number, optional, default: 2) — Base octave for pitches.
* `useExtendedChords` (String, optional, default: "none") — Level of chord extensions to apply: "none", "sevenths", "extended", or "full".

**Outputs:** Array of chord objects: `{ root: string, quality: string, bass: string, notes: string[] }` — e.g., `[{ root: "C", quality: "", bass: "C2", notes: ["C2", "E2", "G2"] }, ...]`.

**Behavior/Algorithm:** Orchestrates the progression generation process by delegating specialized tasks to dedicated modules. First generates a basic Roman numeral progression, then selectively applies chord extensions based on the requested level, converts to pitch-specific chord symbols, and finally applies voice leading through inversions if requested. Maintains the public API while delegating implementation details.

**Dependencies:**
* `./modes`: Mode definitions (`MODES`).
* `./core`: Core music theory utilities.
* `./inversions`: Voice leading and inversion logic.
* `./progression-generator`: Roman numeral progression generation.
* `./chord-extensions`: Selective application of chord extensions.

**Constraints/Assumptions:**
* Assumes valid key and mode name inputs — defaults to C Ionian if invalid.
* Works with all modes defined in the MODES object.
* Produces Western music theory-based progressions with standard chord voicings.

**Non-Responsibilities/Limitations:**
* Does not play audio or manage playback (handled by `audio.js`).
* Does not render UI or format chord symbols for display (handled by React components).
* Not responsible for audio synthesis (delegated to `SynthEngine.js`).
* Does not handle MIDI export directly (handled by `midi-export.js`).
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
\
---\
\
### midi-export.js

**Purpose:** Converts chord progression data to standard MIDI file format for export and download, enabling users to save progressions for use in external digital audio workstations or notation software.

**Inputs:**
* `progression`: Array of chord objects—`{ root: string, quality: string, bass: string, notes: string[] }`—from `logic.js` or `inversions.js`.
* `filename` (String, optional, default: "progression.mid")—Output filename for download.
* `options` (Object, optional)—Additional parameters such as tempo.

**Outputs:** 
* `exportToMidi`: Blob object containing binary MIDI data.
* `downloadMidi`: No return value—triggers browser download of MIDI file.

**Behavior/Algorithm:** Converts pitch-specific notes (e.g., "C2") to MIDI note numbers via direct calculation. Constructs a standards-compliant MIDI file by sequentially adding header chunk, track events (note on/off messages), and metadata. Creates a two-beat duration for each chord, preserving the progression's rhythm. Provides both in-memory export and user-facing download functions.

**Dependencies:**
* `core.js`: `NOTES`—for note-to-MIDI conversion.

**Constraints/Assumptions:** Assumes input chords contain valid `notes` arrays with properly formatted pitch strings (e.g., "C2"). Generates Format 0 MIDI files (single track) with fixed parameters for velocity and timing. Limited to standard MIDI features—no advanced controller data, program changes, or tempo variations within the file.

**Non-Responsibilities/Limitations:** Does not handle audio playback (managed by `audio.js`, `SynthEngine.js`). Does not provide visualization of the MIDI data. Does not support MIDI import. Does not generate chord inversions or voicings (handled by `inversions.js`). No support for Format 1 or 2 MIDI files, multiple tracks, or advanced MIDI messages beyond basic note events.
\
---\
\
### chord-extensions.js

**Purpose:** Selectively applies chord extensions (sevenths, ninths) to appropriate chords in a progression, following music theory principles and desired complexity levels.

**Inputs:**
* `romanNumerals` (Array of Strings) — Progression as Roman numerals (e.g., `["I", "IV", "V", "I"]`).
* `mode` (Object) — Mode definition containing chord qualities and scale information.
* `chordExtensionLevel` (String, optional, default: "none") — Desired complexity level: "none", "sevenths", "extended", or "full".

**Outputs:** Array of Roman numerals with appropriate extensions applied (e.g., `["I", "IV", "V7", "I"]`).

**Behavior/Algorithm:** Applies a carefully controlled number of extensions based on the specified level. Uses music theory principles to prioritize extensions on functionally important chords (V, ii in ii-V progressions). Strictly limits the total number of extended chords based on the extension level to maintain musical authenticity. "Sevenths" level typically adds just one extension (V7), "extended" adds 1-2 extensions, and "full" adds 2-3 extensions with possible 9ths.

**Dependencies:** None — self-contained with no external imports.

**Constraints/Assumptions:**
* Assumes valid Roman numeral input in conventional format.
* Works best with diatonic progressions where V and ii chords have traditional functions.
* Preserves original chord qualities (major, minor, diminished) when adding extensions.
* Avoids extending the final chord of progressions (except in "full" jazz mode).

**Non-Responsibilities/Limitations:**
* Does not handle altered extensions (b9, #11, etc.) — only standard 7ths and 9ths.
* Not responsible for generating the initial progression — works with existing Roman numerals.
* Does not convert to actual chord symbols or notes — only modifies Roman numerals.
* Not responsible for harmonic substitutions or reharmonization.
\
---\
\
### progression-generator.js

**Purpose:** Manages the generation of chord progressions using music theory principles, handling chord-to-chord transitions based on probability distributions specific to each musical mode.

**Inputs:**
* `length` (Number, optional, default: 4) — Desired length of progression.
* `mode` (Object, optional, default: MODES.ionian) — Mode definition containing intervals, chord qualities, and transitions.

**Outputs:** Array of Roman numeral strings representing chord progressions (e.g., `["I", "vi", "IV", "V"]`).

**Behavior/Algorithm:** Generates chord progressions by selecting the tonic chord of the given mode as the starting point, then repeatedly selecting subsequent chords based on transition probabilities defined in the mode. Uses fallback transition matrices when mode-specific transitions aren't defined, ensuring musically appropriate progressions in all modes.

**Dependencies:**
* `./modes`: Import of mode definitions (`MODES`).

**Constraints/Assumptions:**
* Assumes all modes have a defined name and preferably transition probabilities.
* Works with both major-based modes (Ionian, Lydian, Mixolydian) and minor-based modes (Dorian, Phrygian, Aeolian, Locrian).
* Relies on Roman numeral notation for chord representation.

**Non-Responsibilities/Limitations:**
* Does not handle chord extensions (sevenths, ninths, etc.) — delegated to chord-extensions.js.
* Does not convert Roman numerals to actual chord symbols or notes — delegated to core.js.
* Does not apply voice leading or inversions — delegated to inversions.js.
* Not responsible for final note generation or audio output.