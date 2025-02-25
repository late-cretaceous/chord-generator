# Complete Module Specifications

## High-Level Coordinators

### logic.js

**Purpose:** Serves as the main coordinator module for the chord progression generation system, providing a unified API that connects specialized domain managers to produce complete chord progressions.

**Inputs:**
* `length` (Number, optional, default: 4) — Progression length
* `key` (String, optional, default: "C") — Tonic key
* `modeName` (String/Object, optional, default: "ionian") — Musical mode
* `useInversions` (Boolean, optional, default: true) — Toggle inversions
* `rootOctave` (Number, optional, default: 2) — Base octave for pitches
* `useExtendedChords` (String, optional, default: "none") — Level of chord extensions
* `structuralOptions` (Object, optional) — Options for structural features

**Outputs:** Array of chord objects: `{ root: string, quality: string, bass: string, notes: string[], duration: number }`

**Behavior:** Orchestrates the progression generation process by delegating specialized tasks to dedicated domain managers. It no longer implements domain-specific functionality directly but delegates to appropriate domain managers.

**Dependencies:**
* `./modes`: Mode definitions
* `./core`: Core music theory utilities (global utility)
* `./voice/voicing`: Voice leading and inversion logic (domain manager)
* `./progression-generator`: Roman numeral progression generation (domain manager)
* `./structure/structural-progression`: Structural pattern and rhythm management (domain manager)

## Domain Managers

### progression-generator.js

**Purpose:** Manages the generation of chord progressions using music theory principles, handling chord-to-chord transitions based on probability distributions specific to each musical mode.

**Inputs:**
* `length` (Number, optional, default: 4) — Desired length of progression
* `mode` (Object, optional, default: MODES.ionian) — Mode definition
* `options` (Object, optional) — Additional options like pattern types

**Outputs:** 
* Array of Roman numeral strings representing chord progressions (e.g., `["I", "vi", "IV", "V"]`)
* Array of chord objects when using the enhanced generation function

**Behavior:** Generates chord progressions by selecting the tonic chord as the starting point, then repeatedly selecting subsequent chords based on transition probabilities defined in the mode. Can also use predefined harmonic patterns when requested. Now includes enhanced functionality to manage chord extensions and convert to complete chord objects.

**Dependencies:**
* `./modes`: Import of mode definitions (`MODES`)
* `./core`: Core music theory utilities (global utility)
* `./chord-extensions`: Utility for applying chord extensions
* `./voice/cadential-patterns`: Utility for cadential patterns

### structure/structural-progression.js

**Purpose:** Acts as a domain manager that coordinates all structural aspects of progression generation, including harmonic patterns and rhythm variations.

**Inputs:**
* `progression`: Array of chord objects to enhance
* `rhythmPattern`: String/function/array specifying the rhythm pattern
* `patternType`: String indicating the harmonic pattern type
* `totalBeats`: Number specifying total duration for normalization

**Outputs:**
* Enhanced progressions with structural features applied
* Helper functions for available patterns and rhythm types

**Behavior:** Provides a unified interface for applying structural enhancements to progressions. Coordinates between harmonic-rhythm.js and progression-patterns.js to apply rhythm patterns, harmonic patterns, and sequences to chord progressions.

**Dependencies:**
* `./harmonic-rhythm`: For rhythm patterns
* `./progression-patterns`: For harmonic patterns and sequences

### voice/voicing.js

**Purpose:** Coordinates the application of inversions to chord progressions based on voice-leading principles, acting as the primary interface for optimizing chord voicings.

**Inputs:**
* `progression`: Array of chord objects
* Various inputs for helper functions (chord objects, inversion arrays, etc.)

**Outputs:**
* Enhanced progression with optimized inversions
* Utilities for generating inversions and formatting inversion symbols

**Behavior:** Coordinates inversion optimization by generating possible inversions for each chord, evaluating them using voice-leading principles, and selecting the best option based on musical context. Now provides a unified API for handling all voice-related operations, including leading tone handling and cadential patterns.

**Dependencies:**
* `../core`: For pitch manipulation functions (global utility)
* `./melodic-state`: For managing melodic contour (utility)
* `./voice-leading-analysis`: For scoring voice leading quality (utility)
* `./cadential-patterns`: For analyzing and applying cadential patterns (utility)

### audio.js

**Purpose:** Translates pitch-specific note arrays into audio playback via a synthesizer, acting as the bridge between progression data and sound output.

**Inputs:**
* `chords`: Array of chord objects with notes and durations
* `playFullChords`: Boolean—full chord vs. bass only
* `tempo`: Number—tempo in BPM

**Outputs:** None—produces audio output through `SynthEngine`

**Behavior:** Converts pitch strings to frequencies, intelligently schedules chords based on their durations, and manages playback state.

**Dependencies:**
* `./core`: `NOTES`—for frequency calculation
* `./synth/SynthEngine`: For audio synthesis

## Utility Modules

### chord-extensions.js

**Purpose:** Selectively applies chord extensions (sevenths, ninths) to appropriate chords in a progression, following music theory principles and desired complexity levels.

**Inputs:**
* `romanNumerals` (Array of Strings) — Progression as Roman numerals
* `mode` (Object) — Mode definition containing chord qualities
* `chordExtensionLevel` (String) — Desired complexity level

**Outputs:** Array of Roman numerals with appropriate extensions applied

**Behavior:** Applies a controlled number of extensions based on the specified level, prioritizing extensions on functionally important chords (V, ii in ii-V progressions).

**Dependencies:** None — self-contained

### midi-export.js

**Purpose:** Converts chord progression data to standard MIDI file format for export and download.

**Inputs:**
* `progression`: Array of chord objects with notes and durations
* `filename`: Output filename for download
* `options`: Additional parameters such as tempo

**Outputs:** 
* MIDI data as a Blob object
* Download function for saving MIDI files

**Behavior:** Converts pitch-specific notes to MIDI note numbers, constructs a standards-compliant MIDI file respecting chord durations, and provides download functionality.

**Dependencies:**
* `./core`: For note-to-MIDI conversion

### mode-enhancer.js

**Purpose:** Enhances mode definitions with extended chord types based on musical style and complexity level.

**Inputs:**
* `mode`: Base mode definition to enhance
* `enhancementLevel`: Level of enhancement to apply

**Outputs:** Enhanced mode with updated chord qualities

**Behavior:** Applies mode-specific chord enhancements based on musical theory, such as adding sevenths, ninths, and altered tensions to appropriate chord degrees.

**Dependencies:** None — operates on provided mode objects

### structure/harmonic-rhythm.js

**Purpose:** Manages harmonic rhythm patterns and duration assignments for chord progressions.

**Inputs:**
* `length`: Number of chords in the progression
* `patternType`: Rhythm pattern specification
* `totalBeats`: Total beats to normalize to

**Outputs:**
* Duration arrays for chord progressions
* Normalized duration values

**Behavior:** Provides predefined rhythm patterns and algorithms to generate custom patterns, normalize durations, and apply them to progressions.

**Dependencies:** None — self-contained utility module

### structure/progression-patterns.js

**Purpose:** Defines and applies common harmonic patterns and sequences to create musically meaningful chord progressions.

**Inputs:**
* `patternName`: Identifier for the pattern to apply
* `options`: Parameters for pattern generation

**Outputs:** Arrays of Roman numeral chord symbols representing pattern-based progressions

**Behavior:** Implements common harmonic patterns like ii-V-I, circle of fifths, modal mixture, etc., and provides functions to generate, sequence, and combine these patterns.

**Dependencies:**
* `../core`: For music theory utilities

### voice/cadential-patterns.js

**Purpose:** Generates and applies cadential patterns to chord progressions based on music theory principles.

**Inputs:**
* `mode`: Musical mode name
* `patternType`: Type of cadence to generate
* `progression`: Existing progression to enhance

**Outputs:**
* Predefined cadential patterns
* Enhanced progressions with applied cadences

**Behavior:** Provides various cadential patterns appropriate for different musical modes and contexts, with functions to analyze, suggest, and apply these patterns to progressions.

**Dependencies:** None — self-contained

### voice/melodic-state.js

**Purpose:** Maintains and analyzes melodic contour state across a chord progression to guide voice leading decisions.

**Inputs:**
* `melodyMidi`: MIDI pitch value of melody note
* `progressionLength`: Total progression length
* `tonicMidi`: MIDI value of tonic note (optional)

**Outputs:**
* Score adjustments based on melodic analysis
* Current state of melodic tracking

**Behavior:** Implements a stateful tracking system for melodic movement that analyzes consecutive melody notes for patterns of direction, leap behavior, and structural position.

**Dependencies:** None — self-contained with internal state

### voice/voice-leading-analysis.js

**Purpose:** Evaluates and scores chord transitions based on classical voice-leading principles.

**Inputs:**
* Pairs of consecutive chords to analyze
* Progression context information
* Position within progression

**Outputs:**
* Voice leading quality scores
* Analysis of specific voice leading features

**Behavior:** Implements sophisticated voice leading evaluation by examining consecutive chords for parallel intervals, second inversion contexts, bass motion smoothness, and inner voice motion.

**Dependencies:**
* `../core`: For pitch manipulation functions
* `./melodic-state`: For melodic contour tracking

### synth/SynthEngine.js

**Purpose:** Provides audio synthesis capabilities for chord playback.

**Inputs:**
* Frequencies to play
* Preset configuration
* Playback control commands

**Outputs:** Audio output via Web Audio API

**Behavior:** Creates and manages oscillators for each note, applies envelope shaping, manages voice allocation, and handles preset changes.

**Dependencies:**
* `./presets`: Synthesizer preset configurations

### synth/presets.js

**Purpose:** Defines synthesizer presets for different instrument timbres.

**Inputs:**
* Preset name to retrieve or validate

**Outputs:** Preset configuration objects

**Behavior:** Provides predefined synthesizer settings for different timbres and utilities for preset management.

**Dependencies:** None — static data and helper functions

## UI Components

### components/ChordGenerator.jsx

**Purpose:** Provides the main user interface for generating and controlling chord progressions.

**Inputs:**
* User interface interactions
* State values from React hooks

**Outputs:** Rendered UI component with progression controls and display

**Behavior:** Manages UI state for chord generation options, calls appropriate logic functions based on user input, and renders the progression and player components.

**Dependencies:**
* `../lib/logic`: For progression generation
* `../lib/modes`: For mode options
* `../lib/core`: For note names and formatting
* `../lib/structure/structural-progression`: For available patterns
* `./ProgressionPlayer`: For playback controls

### components/ProgressionPlayer.jsx

**Purpose:** Renders UI controls for playing chord progressions with variable durations.

**Inputs:**
* `progression`: Chord progression to play
* `maintainPlayback`: Whether to maintain playback on changes
* `onTempoChange`: Callback for tempo changes
* `tempo`: Current tempo in BPM

**Outputs:** Rendered UI component with playback controls

**Behavior:** Provides play/pause controls, tempo selection, chord mode toggle, and visualization of the chord progression with duration indicators.

**Dependencies:**
* `../lib/audio`: For audio playback
* `./SynthControls`: For synthesizer settings
* `./MidiExportButton`: For MIDI export functionality

### components/SynthControls.jsx

**Purpose:** Provides UI controls for synthesizer settings.

**Inputs:**
* `onPresetChange`: Callback for preset changes
* `currentPreset`: Currently selected preset

**Outputs:** Rendered UI component with synth controls

**Behavior:** Allows selection of different synthesizer presets for chord playback.

**Dependencies:**
* `../lib/synth/presets`: For available synthesizer presets

### components/MidiExportButton.jsx

**Purpose:** Provides a button for exporting progressions as MIDI files.

**Inputs:**
* `progression`: Chord progression to export
* `tempo`: Current tempo in BPM

**Outputs:** Rendered UI component with export button

**Behavior:** Triggers MIDI file generation and download when clicked.

**Dependencies:**
* `../lib/midi-export`: For MIDI file generation and download

### ChordTheoryDisplay.jsx

**Purpose:** Displays detailed music theory information about a chord within its musical context.

**Inputs:**
* `progression` (Array) — The complete chord progression
* `index` (Number) — The index of the current chord in the progression
* `chord` (Object) — Chord object with root, quality, bass, and notes properties
* `keyCenter` (String) — The key of the progression (e.g., "C")
* `mode` (String) — The mode name (e.g., "ionian", "dorian")

**Outputs:** 
* Rendered component displaying formatted chord symbol, chord function, borrowed chord information, and voice leading features

**Behavior:** Analyzes a chord in its musical context to determine its function, whether it's borrowed from another mode, and any voice leading characteristics. Uses music theory principles to provide accurate and meaningful information about each chord.

**Dependencies:**
* `../lib/core`: For access to `NOTES` and other music theory constants

### EnhancedProgressionDisplay.jsx

**Purpose:** Displays a complete chord progression with toggleable music theory analysis, including cadence identification between chord pairs.

**Inputs:**
* `progression` (Array) — Chord progression to display
* `keyCenter` (String) — The key of the progression (e.g., "C")
* `mode` (String) — The mode name (e.g., "ionian", "dorian")
* `activeIndex` (Number, optional) — Currently active chord index for highlighting

**Outputs:** 
* Rendered component with fully formatted chord progression, music theory information, and cadence analysis

**Behavior:** Renders a chord progression with toggleable music theory information. Provides chord function analysis and cadence identification at phrase endings. Focuses on proper musicological analysis, correctly identifying cadences only at appropriate phrase endings.

**Dependencies:**
* `../lib/core`: For access to `NOTES` and other music theory constants
* `./ChordTheoryDisplay`: For individual chord analysis
* `./EnhancedProgressionStyles.css`: For styling

## Global Utilities

### core.js

**Purpose:** Provides foundational music theory utilities and constants for generating scales, chords, and pitch conversions that are used across all domains.

**Inputs:** Varies by function: note names, mode identifiers, scale degrees, chord types, octaves, etc.

**Outputs:** Varies by function: note arrays, chord symbols, roman numerals, MIDI numbers, etc.

**Behavior:** Supplies static data (e.g., `NOTES`, `CHORD_INTERVALS`) and functions for pitch manipulation, chord construction, and modal calculations. As a global utility, it can be imported by both high-level coordinators and domain managers.

**Dependencies:** None—relies on internal constants and JavaScript built-ins