import React, { useState } from 'react';
import ChordTheoryDisplay from './ChordTheoryDisplay';
import { NOTES } from '../lib/core';
import './EnhancedProgressionStyles.css';

/**
 * Displays a chord progression with detailed theory information
 * Now using the embedded theory metadata with improved cadence display
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
            // Determine if this chord is part of a cadence with the next chord
            const isPartOfCadence = index < progression.length - 1 && 
                                  isCadentialConnection(chord, progression[index + 1]);
            
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
                      chord={chord} 
                      hideCadenceInfo={true}
                    />
                    
                    {/* Display half cadence label if applicable */}
                    {chord.theory?.cadence?.type === 'halfCadence' && (
                      <div className="half-cadence-label">
                        Half Cadence
                      </div>
                    )}
                  </div>
                )}
                
                {/* Add cadence label between this chord and the next if applicable */}
                {showTheory && isPartOfCadence && index % 2 === 0 && (
                  <div className="cadence-container">
                    <div className="cadence-connector">
                      <div className="cadence-line"></div>
                      <div className="cadence-label">
                        {formatCadenceType(chord.theory.cadence.type)}
                      </div>
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
 * Format chord display with quality and inversions
 * @param {Object} chord - Chord object to format
 * @returns {JSX.Element} Formatted chord display
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

/**
 * Determines if two chords form a cadential connection
 * @param {Object} chord1 - First chord
 * @param {Object} chord2 - Second chord
 * @returns {boolean} Whether chords form a cadence
 */
function isCadentialConnection(chord1, chord2) {
  // Using the metadata from chord objects
  if (!chord1?.theory?.cadence || !chord2?.theory?.cadence) return false;
  
  // Check if both chords participate in the same cadence
  return chord1.theory.cadence.type === chord2.theory.cadence.type &&
         chord1.theory.cadence.position === 'approach' &&
         chord2.theory.cadence.position === 'resolution';
}

/**
 * Formats a cadence type string for display
 * @param {string} cadenceType - The type of cadence
 * @returns {string} Formatted cadence type
 */
function formatCadenceType(cadenceType) {
  if (!cadenceType) return '';
  
  // Convert camelCase to Title Case with spaces
  const formatted = cadenceType
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim(); // Remove any extra spaces
    
  return `${formatted} Cadence`;
}

export default EnhancedProgressionDisplay;