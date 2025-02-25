import React, { useState } from 'react';
import ChordTheoryDisplay from './ChordTheoryDisplay';
import { NOTES } from '../lib/core';

/**
 * Displays a chord progression with detailed theory information
 * 
 * @param {Object} props Component props
 * @param {Array} props.progression Chord progression to display
 * @param {string} props.keyCenter The key of the progression
 * @param {string} props.mode The mode of the progression
 * @param {number} props.activeIndex Currently active chord index (optional)
 * @returns {JSX.Element} Rendered component
 */
const EnhancedProgressionDisplay = ({ 
  progression, 
  keyCenter = 'C', 
  mode = 'ionian',
  activeIndex = -1
}) => {
  const [showTheory, setShowTheory] = useState(false);
  
  if (!progression || progression.length === 0) {
    return <div className="empty-progression">No progression generated yet</div>;
  }
  
  const toggleTheory = () => {
    setShowTheory(!showTheory);
  };
  
  // Pre-calculate cadence information for display between chords
  const chordAnalysis = progression.map((chord, index) => {
    return analyzeChordInContext(chord, progression, index, keyCenter, mode);
  });
  
  return (
    <div className="enhanced-progression-container">
      <div className="theory-toggle">
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={showTheory}
            onChange={toggleTheory}
            className="chord-toggle-input"
          />
          <span className="toggle-label">
            Show Music Theory
          </span>
        </label>
      </div>
      
      <div className="progression-display">
        <div className="progression">
          {progression.map((chord, index) => {
            // Analyze each chord in context
            const analysis = analyzeChordInContext(chord, progression, index, keyCenter, mode);
            
            return (
              <div 
                key={index} 
                className={`chord-wrapper ${index === activeIndex ? 'active-chord' : ''}`}
              >
                <div className="chord">
                  {formatChord(chord)}
                  {chord.duration !== 1 && (
                    <span className="duration-indicator">×{chord.duration.toFixed(1)}</span>
                  )}
                </div>
                
                {showTheory && (
                  <div className="theory-container">
                    <ChordTheoryDisplay
                      progression={progression}
                      index={index}
                      chord={chord}
                      keyCenter={keyCenter}
                      mode={mode}
                    />
                    
                    {/* If this is the final chord and it's a half cadence, show the label */}
                    {analysis.isFinalHalfCadence && (
                      <div className="half-cadence-label">
                        Half Cadence
                      </div>
                    )}
                  </div>
                )}
                
                {/* Display cadence between this chord and the next */}
                {showTheory && analysis.nextCadence && (
                  <div className="cadence-connector">
                    <div className="cadence-line"></div>
                    <div className="cadence-label">
                      {analysis.nextCadence.type}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {showTheory && (
        <div className="theory-legend mt-4 text-sm text-gray-600">
          <div className="legend-title font-medium">Legend:</div>
          <div className="legend-item">
            <span className="text-blue-600">Blue</span>: Borrowed chord (non-diatonic)
          </div>
          <div className="legend-item">
            <span className="text-purple-600">Purple</span>: Cadential function
          </div>
          <div className="legend-item">
            <span className="text-green-600">Green</span>: Voice leading features
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Analyzes a chord in the context of a progression to determine cadential relationships
 */
function analyzeChordInContext(chord, progression, index, keyCenter, mode) {
  const result = {
    nextCadence: null,
    prevCadence: null
  };
  
  // Get progression length for context
  const length = progression.length;
  
  // Only check for cadences at the end of the progression
  const isLastPair = (index === length - 2);
  
  // For half cadences, we need to check if this is the last chord
  const isLastChord = (index === length - 1);
  
  if (isLastPair) {
    // Check for authentic, plagal, or deceptive cadence in the final pair
    const nextChord = progression[index + 1];
    result.nextCadence = detectCadence(chord, nextChord, keyCenter, mode, "final");
  } 
  else if (isLastChord && !result.nextCadence) {
    // Check for half cadence possibility (only if the progression ends with this chord)
    // We only need to check the chord itself, not its relationship to the next chord
    const { root, quality } = chord;
    const keyIndex = NOTES.indexOf(keyCenter);
    const rootIndex = NOTES.indexOf(root);
    
    if (keyIndex !== -1 && rootIndex !== -1) {
      // Calculate scale degree
      const degree = (rootIndex - keyIndex + 12) % 12;
      
      // Half cadence check - final chord is the dominant (V)
      if (degree === 7 && (quality === 'major' || quality === 'dominant7')) {
        result.isFinalHalfCadence = true;
      }
    }
  }
  
  return result;
}

/**
 * Detects if a chord pair forms a cadence
 * Only identifies true cadences at appropriate phrase endings
 */
function detectCadence(chord1, chord2, keyCenter, mode, position = null) {
  if (!chord1 || !chord2 || !keyCenter) {
    return null;
  }
  
  const { root: root1, quality: quality1 } = chord1;
  const { root: root2, quality: quality2 } = chord2;
  
  // Get indices for interval calculation
  const keyIndex = NOTES.indexOf(keyCenter);
  const root1Index = NOTES.indexOf(root1);
  const root2Index = NOTES.indexOf(root2);
  
  if (keyIndex === -1 || root1Index === -1 || root2Index === -1) {
    return null;
  }
  
  // Calculate scale degrees relative to the key
  const degree1 = (root1Index - keyIndex + 12) % 12;
  const degree2 = (root2Index - keyIndex + 12) % 12;
  
  // Only identify cadences if they're at the final position
  if (position !== "final") {
    return null;
  }
  
  // Authentic cadence (V-I)
  if ((degree1 === 7 && degree2 === 0) &&
      (quality1 === 'major' || quality1 === 'dominant7') &&
      (quality2 === 'major' || quality2 === 'minor')) {
    return {
      type: 'Authentic Cadence'
    };
  }
  
  // Plagal cadence (IV-I)
  if (degree1 === 5 && degree2 === 0 &&
      (quality1 === 'major' || quality1 === 'major7') &&
      (quality2 === 'major' || quality2 === 'minor')) {
    return {
      type: 'Plagal Cadence'
    };
  }
  
  // Deceptive cadence (V-vi)
  if (degree1 === 7 && degree2 === 9 && 
     (quality1 === 'major' || quality1 === 'dominant7') && 
      quality2 === 'minor') {
    return {
      type: 'Deceptive Cadence'
    };
  }
  
  // We don't detect Half Cadences here - those are handled separately
  // since they depend on being the very last chord of the progression
  
  return null;
}

/**
 * Format chord display with quality and inversions
 */
function formatChord(chord) {
  if (!chord || typeof chord !== 'object') return chord;
  
  // Get quality suffix
  let qualitySuffix = '';
  switch (chord.quality) {
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
      qualitySuffix = chord.quality === 'major' ? '' : chord.quality;
  }
  
  const base = `${chord.root}${qualitySuffix}`;
  
  // Check for inversion
  if (chord.bass && chord.bass !== `${chord.root}2`) {
    const bassNote = chord.bass.replace(/[0-9]/, '');
    return <>{base}<span className="chord-inversion">/{bassNote}</span></>;
  }
  
  return base;
}

export default EnhancedProgressionDisplay;