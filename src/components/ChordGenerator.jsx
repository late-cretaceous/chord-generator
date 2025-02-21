import React, { useState, useEffect } from 'react';
import { generateProgression } from '../lib/logic';
import { MODES } from '../lib/modes';
import { NOTES } from '../lib/core';
import ProgressionPlayer from './ProgressionPlayer';
import './ChordGenerator.css';

const ChordGenerator = () => {
  const [progression, setProgression] = useState([]);
  const [length, setLength] = useState(4);
  const [selectedMode, setSelectedMode] = useState('ionian');
  const [selectedKey, setSelectedKey] = useState('C');
  const [useInversions, setUseInversions] = useState(true);
  const [debug, setDebug] = useState({});

  const handleLengthChange = (event) => {
    const newLength = parseInt(event.target.value, 10);
    if (newLength >= 2 && newLength <= 8) {
      setLength(newLength);
    }
  };

  const handleModeChange = (event) => {
    setSelectedMode(event.target.value);
  };

  const handleKeyChange = (event) => {
    setSelectedKey(event.target.value);
  };

  const handleInversionToggle = () => {
    setUseInversions(!useInversions);
  };

  const handleGenerate = () => {
    // Store the parameters we're using for debugging
    const debugInfo = {
      length,
      key: selectedKey,
      mode: selectedMode,
      useInversions
    };
    
    // Generate the progression
    const mode = MODES[selectedMode] || MODES.ionian;
    const newProgression = generateProgression(length, selectedKey, mode, useInversions);
    
    // Update the debug info with the result
    debugInfo.generatedProgression = newProgression;
    setDebug(debugInfo);
    
    // Set the progression state
    setProgression(newProgression);
  };

  // Function to highlight and format slash chord notation
  const formatChord = (chord) => {
    if (chord && chord.includes('/')) {
      const [base, bass] = chord.split('/');
      return (
        <>
          {base}<span className="chord-inversion">/{bass}</span>
        </>
      );
    }
    return chord;
  };

  // Effect to log progression changes
  useEffect(() => {
    if (progression.length > 0) {
      console.log('Progression updated:', progression);
      console.log('Any slash chords?', progression.some(chord => chord.includes('/')));
    }
  }, [progression]);

  return (
    <div className="container">
      <div className="card">
        <h2>Chord Progression Generator</h2>
        
        <div className="display">
          {progression.length > 0 ? (
            <>
              <div className="progression">
                {progression.map((chord, index) => (
                  <div key={index} className="chord">
                    {formatChord(chord)}
                  </div>
                ))}
              </div>
              <div className="player-controls">
                <ProgressionPlayer 
                  progression={progression}
                  maintainPlayback={true} 
                />
              </div>
              
              {/* Add debug info */}
              <div className="debug-info" style={{ fontSize: '12px', color: '#666', margin: '10px 0', textAlign: 'left', width: '100%' }}>
                <div>Generated with: {JSON.stringify(debug, null, 2)}</div>
                <div>Raw progression: {JSON.stringify(progression)}</div>
                <div>Contains slash chords: {progression.some(chord => chord && chord.includes('/')).toString()}</div>
              </div>
            </>
          ) : (
            <p className="placeholder">
              Click generate to create a progression
            </p>
          )}
        </div>

        <div className="controls">
          <div className="control-group">
            <div className="key-control">
              <label htmlFor="key-select">Key:</label>
              <select
                id="key-select"
                value={selectedKey}
                onChange={handleKeyChange}
                className="key-select"
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>
                    {note}
                  </option>
                ))}
              </select>
            </div>

            <div className="mode-control">
              <label htmlFor="mode-select">Mode:</label>
              <select
                id="mode-select"
                value={selectedMode}
                onChange={handleModeChange}
                className="mode-select"
              >
                {Object.keys(MODES).map(mode => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="length-control">
            <label htmlFor="length-slider">Length: {length}</label>
            <input
              type="range"
              id="length-slider"
              min="2"
              max="8"
              value={length}
              onChange={handleLengthChange}
              className="length-slider"
            />
            <div className="slider-labels">
              <span>2</span>
              <span>8</span>
            </div>
          </div>

          <div className="chord-mode-toggle inversion-toggle">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={useInversions}
                onChange={handleInversionToggle}
                className="chord-toggle-input"
              />
              <span className="toggle-label">
                Use Inversions
              </span>
            </label>
            <span className="toggle-hint">
              Apply voice leading with slash chords
            </span>
          </div>

          <button onClick={handleGenerate}>
            Generate Progression
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChordGenerator;