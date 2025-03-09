import React, { useState } from 'react';
import ChordTheoryDisplay from './ChordTheoryDisplay';
import { NOTES } from '../lib/core';
import './EnhancedProgressionStyles.css';

/**
 * Displays a chord progression with toggleable theory information
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
  
  return (
    <div className="enhanced-progression-container">
      <div className="theory-toggle">
        <button 
          className="toggle-button" 
          onClick={() => setShowTheory(!showTheory)}
        >
          {showTheory ? 'Hide Theory' : 'Show Theory'}
        </button>
      </div>
      
      <div className="progression-display">
        <div className="progression">
          {progression.map((chord, index) => (
            <div 
              key={index} 
              className={`chord-wrapper ${index === activeIndex ? 'active-chord' : ''}`}
            >
              <div className="chord">
                {formatChord(chord)}
                {chord.duration !== 1 && chord.duration && (
                  <span className="duration-indicator">×{chord.duration.toFixed(1)}</span>
                )}
              </div>
              
              {showTheory && (
                <div className="theory-container">
                  <ChordTheoryDisplay 
                    chord={chord}
                    hideCadenceInfo={false}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
      qualitySuffix = '°'; // Using the degree symbol for diminished
      break;
    case 'augmented':
      qualitySuffix = '+'; // Using plus sign for augmented
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
    case 'halfDiminished7':
      qualitySuffix = 'ø7';
      break;
    case 'minorMajor7':
      qualitySuffix = 'mM7';
      break;
    case 'add9':
      qualitySuffix = 'add9';
      break;
    case 'minor9':
      qualitySuffix = 'm9';
      break;
    case 'major9':
      qualitySuffix = 'maj9';
      break;
    case 'dominant9':
      qualitySuffix = '9';
      break;
    default:
      qualitySuffix = chord.quality === 'major' ? '' : chord.quality;
  }
  
  // Handle inversions (slash chords)
  if (chord.bass && chord.bass !== `${chord.root}2`) {
    const bassNote = chord.bass.replace(/[0-9]/, '');
    return <span className="chord-with-inversion">{chord.root}{qualitySuffix}<span className="chord-inversion">/{bassNote}</span></span>;
  }
  
  return <span>{chord.root}{qualitySuffix}</span>;
}

export default EnhancedProgressionDisplay;