import React, { useState } from 'react';
import { NOTES } from '../lib/core';
import './ChordGenerator.css';

/**
 * Displays a chord progression without detailed theory information
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
  if (!progression || progression.length === 0) {
    return <div className="empty-progression">No progression generated yet</div>;
  }
  
  return (
    <div className="enhanced-progression-container">
      <div className="progression-display">
        <div className="progression">
          {progression.map((chord, index) => (
            <div 
              key={index} 
              className={`chord ${index === activeIndex ? 'active-chord' : ''}`}
            >
              {formatChord(chord)}
              {chord.duration !== 1 && chord.duration && (
                <span className="duration-indicator">×{chord.duration.toFixed(1)}</span>
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