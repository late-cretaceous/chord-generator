import React, { useState } from "react";
import {
  generateProgression,
  generateStructuredProgression,
} from "../lib/logic";
import { MODES } from "../lib/modes";
import { NOTES } from "../lib/core";
import {
  getAvailableRhythmPatterns,
  getAvailableHarmonicPatterns,
} from "../lib/structure/structural-progression.js";
import ProgressionPlayer from "./ProgressionPlayer";
import EnhancedProgressionDisplay from "./EnhancedProgressionDisplay";
import "./ChordGenerator.css";

const ChordGenerator = () => {
  const [progression, setProgression] = useState([]);
  const [length, setLength] = useState(4);
  const [selectedMode, setSelectedMode] = useState("ionian");
  const [selectedKey, setSelectedKey] = useState("C");
  const [useInversions, setUseInversions] = useState(true);
  const [chordExtensionLevel, setChordExtensionLevel] = useState("none");
  const [currentTempo, setCurrentTempo] = useState(108);
  const [showOptions, setShowOptions] = useState(false);

  // State for advanced options
  const [rhythmPattern, setRhythmPattern] = useState("uniform");
  const [patternType, setPatternType] = useState("");
  const [useStructuralPattern, setUseStructuralPattern] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Sound settings state
  const [playFullChords, setPlayFullChords] = useState(true);
  const [currentPreset, setCurrentPreset] = useState("strings");
  const [isArpeggiated, setIsArpeggiated] = useState(false);

  // Fetch available patterns from domain manager
  const rhythmPatterns = getAvailableRhythmPatterns();
  const harmonicPatterns = getAvailableHarmonicPatterns();

  const handleGenerate = () => {
    const mode = MODES[selectedMode] || MODES.ionian;

    // Use structured generation if advanced features are enabled
    if (showAdvancedOptions) {
      const options = {
        length,
        key: selectedKey,
        mode: selectedMode,
        useInversions,
        rootOctave: 2,
        useExtendedChords: chordExtensionLevel,
        harmonicRhythm: rhythmPattern,
        patternType: patternType || null,
        useStructuralPattern: patternType ? true : useStructuralPattern,
        totalBeats: length * 2, // Default to 2 beats per chord
      };

      const newProgression = generateStructuredProgression(options);
      setProgression(newProgression);
    } else {
      // Use the standard generator for basic features
      const newProgression = generateProgression(
        length,
        selectedKey,
        mode,
        useInversions,
        2, // rootOctave
        chordExtensionLevel
      );
      setProgression(newProgression);
    }
  };

  const handleTempoChange = (newTempo) => setCurrentTempo(newTempo);
  const toggleOptions = () => setShowOptions(!showOptions);
  
  // Handler for instrument preset change
  const handlePresetChange = (preset) => {
    setCurrentPreset(preset);
  };

  // Handler for arpeggio toggle
  const handleArpeggioToggle = (isArpeggiated) => {
    setIsArpeggiated(isArpeggiated);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Chord Progression Generator</h2>
        
        {/* Main progression display - always visible */}
        <div className="display">
          {progression.length > 0 ? (
            <EnhancedProgressionDisplay
              progression={progression}
              keyCenter={selectedKey}
              mode={selectedMode}
            />
          ) : (
            <p className="placeholder">
              Click generate to create a progression
            </p>
          )}
        </div>
        
        {/* Updated player and controls layout */}
        <div className="controls-wrapper">
          {/* Player controls - always visible */}
          <div className="player-container">
            <ProgressionPlayer
              progression={progression}
              maintainPlayback={true}
              onTempoChange={handleTempoChange}
              tempo={currentTempo}
              simplified={true}
              playFullChords={playFullChords}
              currentPreset={currentPreset}
              onPresetChange={handlePresetChange}
              isDisabled={progression.length === 0}
              isArpeggiated={isArpeggiated}
              onArpeggioToggle={handleArpeggioToggle}
            />
          </div>
          
          {/* Generate button */}
          <div className="generate-button-container">
            <button onClick={handleGenerate} className="generate-button">
              Generate Progression
            </button>
          </div>
        </div>
        
        {/* Options toggle button */}
        <div className="options-toggle">
          <button onClick={toggleOptions} className="toggle-button">
            {showOptions ? "Hide Options" : "Show Options"}
          </button>
        </div>
        
        {/* Collapsible options menu */}
        {showOptions && (
          <div className="options-panel">
            <div className="options-content">
              {/* Sound Settings Section */}
              <div className="option-section">
                <h3>Sound Settings</h3>
                <div className="control-group">
                  <div className="instrument-control">
                    <label htmlFor="instrument-select">Instrument:</label>
                    <select
                      id="instrument-select"
                      value={currentPreset}
                      onChange={(e) => setCurrentPreset(e.target.value)}
                      className="synth-select"
                    >
                      <option value="strings">Strings</option>
                      <option value="electric_piano">Electric Piano</option>
                      <option value="organ">Organ</option>
                      <option value="pad">Synth Pad</option>
                      <option value="brass">Brass</option>
                    </select>
                  </div>
                  <div className="tempo-control">
                    <label htmlFor="tempo-select">Tempo:</label>
                    <select
                      id="tempo-select"
                      value={currentTempo === 50 ? "largo" : 
                             currentTempo === 72 ? "adagio" :
                             currentTempo === 108 ? "moderato" :
                             currentTempo === 132 ? "allegro" : "presto"}
                      onChange={(e) => {
                        const tempoMap = {
                          "largo": 50,
                          "adagio": 72,
                          "moderato": 108,
                          "allegro": 132,
                          "presto": 168
                        };
                        const newTempo = tempoMap[e.target.value] || 108;
                        setCurrentTempo(newTempo);
                        handleTempoChange(newTempo);
                      }}
                      className="tempo-select"
                    >
                      <option value="largo">Very Slow</option>
                      <option value="adagio">Slow</option>
                      <option value="moderato">Medium</option>
                      <option value="allegro">Fast</option>
                      <option value="presto">Very Fast</option>
                    </select>
                  </div>
                </div>
                
                <div className="chord-mode-toggles">
                  <div className="chord-mode-toggle">
                    <label className="toggle-container">
                      <input
                        type="checkbox"
                        checked={playFullChords}
                        onChange={() => setPlayFullChords(!playFullChords)}
                        className="chord-toggle-input"
                      />
                      <span className="toggle-label">
                        {playFullChords ? 'Full Chords' : 'Root Notes Only'}
                      </span>
                    </label>
                  </div>
                  
                  <div className="chord-mode-toggle">
                    <label className="toggle-container">
                      <input
                        type="checkbox"
                        checked={isArpeggiated}
                        onChange={() => setIsArpeggiated(!isArpeggiated)}
                        className="chord-toggle-input"
                      />
                      <span className="toggle-label">
                        {isArpeggiated ? 'Arpeggiated' : 'Block Chords'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="control-group">
                <div className="key-control">
                  <label htmlFor="key-select">Key:</label>
                  <select
                    id="key-select"
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="key-select"
                  >
                    {NOTES.map((note) => (
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
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="mode-select"
                  >
                    {Object.keys(MODES).map((mode) => (
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
                  onChange={(e) => setLength(parseInt(e.target.value, 10))}
                  className="length-slider"
                />
                <div className="slider-labels">
                  <span>2</span>
                  <span>8</span>
                </div>
              </div>

              <div className="chord-extensions-control">
                <label htmlFor="extensions-select">Chord Complexity:</label>
                <select
                  id="extensions-select"
                  value={chordExtensionLevel}
                  onChange={(e) => setChordExtensionLevel(e.target.value)}
                  className="mode-select"
                >
                  <option value="none">Basic Triads</option>
                  <option value="sevenths">Seventh Chords</option>
                  <option value="extended">Extended Chords</option>
                  <option value="full">Full Jazz Harmony</option>
                </select>
              </div>

              <div className="chord-mode-toggle inversion-toggle">
                <label className="toggle-container">
                  <input
                    type="checkbox"
                    checked={useInversions}
                    onChange={() => setUseInversions(!useInversions)}
                    className="chord-toggle-input"
                  />
                  <span className="toggle-label">Use Inversions</span>
                </label>
              </div>

              {/* Advanced options toggle */}
              <div className="advanced-options-toggle">
                <button 
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} 
                  className="toggle-button"
                >
                  {showAdvancedOptions
                    ? "Hide Advanced Options"
                    : "Show Advanced Options"}
                </button>
              </div>

              {/* Advanced structural options */}
              {showAdvancedOptions && (
                <div className="advanced-options">
                  <div className="option-section">
                    <h3>Harmonic Rhythm</h3>
                    <div className="rhythm-control">
                      <label htmlFor="rhythm-select">Rhythm Pattern:</label>
                      <select
                        id="rhythm-select"
                        value={rhythmPattern}
                        onChange={(e) => setRhythmPattern(e.target.value)}
                        className="mode-select"
                      >
                        {Object.entries(rhythmPatterns).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="option-section">
                    <h3>Structural Patterns</h3>
                    <div className="pattern-control">
                      <label htmlFor="pattern-select">Harmonic Pattern:</label>
                      <select
                        id="pattern-select"
                        value={patternType}
                        onChange={(e) => setPatternType(e.target.value)}
                        className="mode-select"
                      >
                        <option value="">No specific pattern</option>
                        {Object.entries(harmonicPatterns).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="chord-mode-toggle structural-toggle">
                      <label className="toggle-container">
                        <input
                          type="checkbox"
                          checked={useStructuralPattern}
                          onChange={() => setUseStructuralPattern(!useStructuralPattern)}
                          className="chord-toggle-input"
                          disabled={patternType !== ""}
                        />
                        <span className="toggle-label">
                          Allow Structural Patterns
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChordGenerator;