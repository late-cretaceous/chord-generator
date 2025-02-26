import React from 'react';

/**
 * A component that displays detailed music theory information about chords
 * Now directly using the embedded theory metadata
 * 
 * @param {Object} props Component props
 * @param {Object} props.chord The chord object to display theory for
 * @param {boolean} props.hideCadenceInfo Whether to hide cadence information
 * @returns {JSX.Element} Rendered component
 */
const ChordTheoryDisplay = ({ chord, hideCadenceInfo = false }) => {
  // Extract theory metadata from chord object
  const theory = chord.theory || {};
  
  return (
    <div className="chord-theory-container">
      {/* Roman numeral and function */}
      {theory.romanNumeral && (
        <div className="chord-roman text-xs text-gray-500 mb-1">
          {theory.romanNumeral}
        </div>
      )}
      
      {theory.function && (
        <div className="chord-function text-sm text-gray-600">
          {theory.function}
        </div>
      )}
      
      {/* Diatonic/borrowed information */}
      {theory.isDiatonic === false && (
        <div className="chord-borrowed text-xs text-blue-600">
          {theory.borrowedFrom ? `from ${theory.borrowedFrom}` : 'non-diatonic'}
        </div>
      )}
      
      {/* Cadence information - only show if not hidden */}
      {!hideCadenceInfo && theory.cadence && (
        <div className="chord-cadence text-xs text-purple-600">
          {formatCadenceInfo(theory.cadence)}
        </div>
      )}
      
      {/* Voice leading information */}
      {theory.voicing && (
        <div className="voice-leading text-xs text-green-600">
          {formatVoicingInfo(theory.voicing)}
        </div>
      )}
      
      {/* Chord extension information */}
      {theory.extension && (
        <div className="chord-extension text-xs text-amber-600">
          {theory.extension.description}
        </div>
      )}
    </div>
  );
};

/**
 * Formats cadence information for display
 * @param {Object} cadence - Cadence metadata
 * @returns {string} Formatted cadence display
 */
function formatCadenceInfo(cadence) {
  if (!cadence) return '';
  
  const type = cadence.type.charAt(0).toUpperCase() + cadence.type.slice(1);
  
  if (cadence.position === 'approach') {
    return `${type} cadence approach`;
  } else if (cadence.position === 'resolution') {
    return `${type} cadence resolution`;
  }
  
  return `${type} cadence`;
}

/**
 * Formats voice leading information for display
 * @param {Object} voicing - Voice leading metadata
 * @returns {string} Formatted voice leading display
 */
function formatVoicingInfo(voicing) {
  if (!voicing) return '';
  
  let info = [];
  
  if (voicing.inversionName) {
    info.push(voicing.inversionName);
  }
  
  if (voicing.smoothness) {
    info.push(voicing.smoothness);
  }
  
  if (voicing.hasLeadingTone) {
    info.push('Leading tone');
  }
  
  return info.join(' • ');
}

export default ChordTheoryDisplay;