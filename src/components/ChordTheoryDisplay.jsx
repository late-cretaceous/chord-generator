import React from 'react';
import { NOTES } from '../lib/core';

/**
 * A component that displays detailed music theory information about chords in context
 * 
 * @param {Object} props Component props
 * @param {Array} props.progression The full chord progression
 * @param {number} props.index The index of the current chord in the progression
 * @param {Object} props.chord The chord object to analyze
 * @param {string} props.key The key of the progression
 * @param {string} props.mode The mode of the progression
 * @returns {JSX.Element} Rendered component
 */
const ChordTheoryDisplay = ({ progression, index, chord, keyCenter = 'C', mode = 'ionian' }) => {
  // Determine if the chord is diatonic or borrowed
  const chordInfo = analyzeChord(chord, keyCenter, mode, progression, index);
  
  // Format the chord symbol with bass note if it's an inversion
  const formattedChord = formatChordSymbol(chord);
  
  return (
    <div className="chord-theory-container">
      <div className="chord-symbol text-lg font-bold">
        {formattedChord}
      </div>
      
      {chordInfo.function && (
        <div className="chord-function text-sm text-gray-600">
          {chordInfo.function}
        </div>
      )}
      
      {chordInfo.isBorrowed && (
        <div className="chord-borrowed text-xs text-blue-600">
          borrowed from {chordInfo.borrowedFrom}
        </div>
      )}
      
      {chordInfo.isCadential && (
        <div className="chord-cadence text-xs text-purple-600">
          {chordInfo.cadenceType}
        </div>
      )}
      
      {chordInfo.voiceLeadingNote && (
        <div className="voice-leading-note text-xs text-green-600">
          {chordInfo.voiceLeadingNote}
        </div>
      )}
    </div>
  );
};

/**
 * Formats a chord symbol with appropriate slash notation for inversions
 */
function formatChordSymbol(chord) {
  if (!chord) return '';
  
  const { root, quality, bass } = chord;
  if (!root) return '';
  
  // Determine quality suffix
  let qualitySuffix = '';
  switch (quality) {
    case 'minor':
      qualitySuffix = 'm';
      break;
    case 'diminished':
      qualitySuffix = 'dim';
      break;
    case 'augmented':
      qualitySuffix = 'aug';
      break;
    case 'dominant7':
      qualitySuffix = '7';
      break;
    case 'major7':
      qualitySuffix = 'maj7';
      break;
    case 'minor7':
      qualitySuffix = 'm7';
      break;
    default:
      qualitySuffix = quality === 'major' ? '' : quality;
  }
  
  // Check if it's an inversion
  const bassPitch = bass ? bass.replace(/[0-9]/, '') : '';
  if (bassPitch && bassPitch !== root) {
    return `${root}${qualitySuffix}/${bassPitch}`;
  }
  
  return `${root}${qualitySuffix}`;
}

/**
 * Analyzes a chord in context to determine its function and characteristics
 */
function analyzeChord(chord, keyCenter, mode, progression, index) {
  if (!chord || !keyCenter || !mode) {
    return { function: null, isBorrowed: false };
  }
  
  const { root, quality, notes } = chord;
  
  // Basic result object
  const result = {
    function: null,
    isBorrowed: false,
    borrowedFrom: null,
    voiceLeadingNote: null
  };
  
  // Determine scale degrees and chord functions based on mode
  const keyIndex = NOTES.indexOf(keyCenter);
  if (keyIndex === -1) return result;
  
  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) return result;
  
  // Calculate scale degree (0-based)
  const scaleDegree = (rootIndex - keyIndex + 12) % 12;
  
  // Check if the chord is diatonic to the mode
  const isDiatonic = isDiatonicChord(scaleDegree, quality, mode);
  
  // Set chord function based on scale degree
  result.function = getChordFunction(scaleDegree, quality, mode);
  
  // Determine if the chord is borrowed
  if (!isDiatonic) {
    result.isBorrowed = true;
    result.borrowedFrom = determineBorrowedSource(scaleDegree, quality, mode);
  }
  
  // Check for leading tones or voice leading features
  if (notes && notes.length > 0) {
    const voiceLeadingInfo = analyzeVoiceLeading(chord, mode, keyCenter);
    result.voiceLeadingNote = voiceLeadingInfo.note;
  }
  
  return result;
}

/**
 * Checks if a chord is diatonic to the given mode
 */
function isDiatonicChord(scaleDegree, quality, mode) {
  // Simplified diatonic check for common modes
  // In reality, this would check against the full mode definition
  
  // Major mode (Ionian) diatonic qualities
  const ionianQualities = {
    0: ['major', 'major7', 'dominant7'], // I
    2: ['minor', 'minor7'], // ii
    4: ['minor', 'minor7'], // iii
    5: ['major', 'major7'], // IV
    7: ['major', 'dominant7'], // V
    9: ['minor', 'minor7'], // vi
    11: ['diminished', 'halfDiminished7'] // vii°
  };
  
  // Dorian mode diatonic qualities
  const dorianQualities = {
    0: ['minor', 'minor7'], // i
    2: ['minor', 'minor7'], // ii
    3: ['major', 'major7'], // ♭III
    5: ['major', 'major7'], // IV
    7: ['minor', 'minor7', 'dominant7'], // v/V (can be dominant in practice)
    9: ['diminished', 'halfDiminished7'], // vi°
    10: ['major', 'dominant7'] // ♭VII
  };
  
  // Select the appropriate mode definition
  let modeQualities;
  switch (mode) {
    case 'dorian':
      modeQualities = dorianQualities;
      break;
    case 'ionian':
    default:
      modeQualities = ionianQualities;
  }
  
  // Check if this chord quality is diatonic for this scale degree
  return modeQualities[scaleDegree] && modeQualities[scaleDegree].includes(quality);
}

/**
 * Determines the function of a chord based on its scale degree and mode
 */
function getChordFunction(scaleDegree, quality, mode) {
  // Common chord functions
  const functions = {
    'ionian': {
      0: 'Tonic',
      2: 'Supertonic',
      4: 'Mediant',
      5: 'Subdominant',
      7: 'Dominant',
      9: 'Submediant',
      11: 'Leading Tone'
    },
    'dorian': {
      0: 'Tonic',
      2: 'Supertonic',
      3: 'Mediant (♭3)',
      5: 'Subdominant',
      7: quality === 'dominant7' || quality === 'major' ? 'Secondary Dominant' : 'Dominant',
      9: 'Submediant',
      10: 'Subtonic (♭7)'
    }
  };
  
  // Default to ionian if mode not found
  const modeMap = functions[mode] || functions.ionian;
  
  return modeMap[scaleDegree] || `Scale degree ${scaleDegree + 1}`;
}

/**
 * Determines where a borrowed chord might come from
 */
function determineBorrowedSource(scaleDegree, quality, mode) {
  // When in Dorian mode with a major V chord
  if (mode === 'dorian' && scaleDegree === 7 && (quality === 'major' || quality === 'dominant7')) {
    return 'harmonic minor';
  }
  
  // Default general cases
  if (mode === 'ionian' || mode === 'lydian' || mode === 'mixolydian') {
    return 'parallel minor';
  } else {
    return 'parallel major';
  }
}

/**
 * Detects if a chord pair forms a cadence
 */
function detectCadence(chord, nextChord, mode) {
  if (!chord || !nextChord) {
    return { isCadence: false, type: null };
  }
  
  const { root: currRoot, quality: currQuality } = chord;
  const { root: nextRoot, quality: nextQuality } = nextChord;
  
  const currIndex = NOTES.indexOf(currRoot);
  const nextIndex = NOTES.indexOf(nextRoot);
  
  if (currIndex === -1 || nextIndex === -1) {
    return { isCadence: false, type: null };
  }
  
  // Calculate interval between roots
  const interval = (nextIndex - currIndex + 12) % 12;
  
  // Authentic cadence (V-I)
  if (interval === 7) { // P5 down or P4 up
    if ((currQuality === 'major' || currQuality === 'dominant7')) {
      if (nextQuality === 'major') {
        return { isCadence: true, type: 'Authentic Cadence', position: 'after' };
      } else if (nextQuality === 'minor') {
        return { isCadence: true, type: 'Authentic Cadence', position: 'after' };
      }
    }
  }
  
  // Plagal cadence (IV-I)
  if (interval === 5) { // P4 down or P5 up
    // In C major, F is 5 semitones up from C (or 7 down), so interval should be 5
    if (currQuality === 'major' || currQuality === 'major7') {
      if (nextQuality === 'major' || nextQuality === 'minor') {
        // Check if current chord is the IV chord (subdominant)
        return { isCadence: true, type: 'Plagal Cadence', position: 'after' };
      }
    }
  }
  
  // Deceptive cadence (V-vi)
  if ((currQuality === 'major' || currQuality === 'dominant7')) {
    // In C major, V-vi would be G to Am, which is an interval of 3 semitones up
    if (nextQuality === 'minor' && interval === 3) {
      return { isCadence: true, type: 'Deceptive Cadence', position: 'after' };
    }
  }
  
  // Half cadence (ends on V)
  // This would be identified on the previous chord pair, but we include it here
  // to highlight the dominant function
  if ((currQuality === 'major' || currQuality === 'dominant7') && 
     (interval === 0) && // The chord itself, not the previous
     (currRoot === getKeySignatureNote(5, mode))) {
    return { isCadence: true, type: 'Half Cadence', position: 'current' };
  }
  
  return { isCadence: false, type: null };
}

/**
 * Helper function to get the note at a specific scale degree in a key signature
 */
function getKeySignatureNote(scaleDegree, mode) {
  // This is simplified and would need a proper implementation
  // that considers the full key signature based on mode
  const majorScaleDegrees = {
    1: 'C', // I
    4: 'F', // IV
    5: 'G'  // V
  };
  
  return majorScaleDegrees[scaleDegree] || 'C';
}

/**
 * Analyzes chord for voice leading features like leading tones
 */
function analyzeVoiceLeading(chord, mode, keyCenter) {
  if (!chord || !chord.notes || chord.notes.length === 0) {
    return { note: null };
  }
  
  // Check for leading tone (note a half step below the tonic)
  const keyIndex = NOTES.indexOf(keyCenter);
  if (keyIndex === -1) return { note: null };
  
  const leadingToneIndex = (keyIndex - 1 + 12) % 12;
  const leadingTone = NOTES[leadingToneIndex];
  
  // Check if any note in the chord is the leading tone
  for (const note of chord.notes) {
    const noteName = note.replace(/[0-9]/, '');
    if (noteName === leadingTone) {
      return { note: 'Contains leading tone' };
    }
  }
  
  return { note: null };
}

export default ChordTheoryDisplay;