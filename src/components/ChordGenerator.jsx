import React, { useState } from 'react';
import { generateProgression, generateStructuredProgression } from '../lib/logic';
import { MODES } from '../lib/modes';
import { NOTES, getQualitySymbol } from '../lib/core';
import { getAvailableRhythmPatterns, getAvailableHarmonicPatterns } from '../lib/structure/structural-progression.js';
import ProgressionPlayer from './ProgressionPlayer';
import './ChordGenerator.css';

const ChordGenerator = () => {
    const [progression, setProgression] = useState([]);
    const [length, setLength] = useState(4);
    const [selectedMode, setSelectedMode] = useState('ionian');
    const [selectedKey, setSelectedKey] = useState('C');
    const [useInversions, setUseInversions] = useState(true);
    const [chordExtensionLevel, setChordExtensionLevel] = useState('none');
    const [currentTempo, setCurrentTempo] = useState(108);
    
    // Fetch available patterns from domain manager
    const rhythmPatterns = getAvailableRhythmPatterns();
    const harmonicPatterns = getAvailableHarmonicPatterns();
    
    // New state for harmonic rhythm and structural patterns
    const [rhythmPattern, setRhythmPattern] = useState('uniform');
    const [patternType, setPatternType] = useState('');
    const [useStructuralPattern, setUseStructuralPattern] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const handleLengthChange = (event) => {
        const newLength = parseInt(event.target.value, 10);
        if (newLength >= 2 && newLength <= 8) setLength(newLength);
    };

    const handleModeChange = (event) => setSelectedMode(event.target.value);

    const handleKeyChange = (event) => setSelectedKey(event.target.value);

    const handleInversionToggle = () => setUseInversions(!useInversions);
    
    const handleChordExtensionChange = (event) => setChordExtensionLevel(event.target.value);
    
    const handleRhythmPatternChange = (event) => setRhythmPattern(event.target.value);
    
    const handlePatternTypeChange = (event) => setPatternType(event.target.value);
    
    const handleStructuralPatternToggle = () => setUseStructuralPattern(!useStructuralPattern);
    
    const toggleAdvancedOptions = () => setShowAdvancedOptions(!showAdvancedOptions);

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
                totalBeats: length * 2 // Default to 2 beats per chord
            };
            
            const newProgression = generateStructuredProgression(options);
            console.log('Generated structured:', newProgression);
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
            console.log('Generated:', newProgression);
            setProgression(newProgression);
        }
    };

    const handleTempoChange = (newTempo) => setCurrentTempo(newTempo);

    const formatChord = (chord) => {
        if (!chord || typeof chord !== 'object') return chord;
        // Ensure quality is normalized even if "major" slips through
        const quality = getQualitySymbol(chord.quality === 'major' ? '' : chord.quality);
        const base = `${chord.root}${quality}`;
        if (chord.bass && chord.bass !== `${chord.root}2`) {
            const bassNote = chord.bass.replace(/[0-9]/, '');
            return <>{base}<span className="chord-inversion">/{bassNote}</span></>;
        }
        return base;
    };

    const formatDuration = (chord) => {
        if (!chord || !chord.duration) return null;
        // Only show duration if it's not the default 1.0
        if (chord.duration === 1) return null;
        return <span className="duration-indicator">×{chord.duration.toFixed(1)}</span>;
    };

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
                                        {formatDuration(chord)}
                                    </div>
                                ))}
                            </div>
                            <ProgressionPlayer 
                                progression={progression}
                                maintainPlayback={true}
                                onTempoChange={handleTempoChange}
                                tempo={currentTempo}
                            />
                        </>
                    ) : (
                        <p className="placeholder">Click generate to create a progression</p>
                    )}
                </div>
                <div className="controls">
                    <div className="control-group">
                        <div className="key-control">
                            <label htmlFor="key-select">Key:</label>
                            <select id="key-select" value={selectedKey} onChange={handleKeyChange} className="key-select">
                                {NOTES.map(note => <option key={note} value={note}>{note}</option>)}
                            </select>
                        </div>
                        <div className="mode-control">
                            <label htmlFor="mode-select">Mode:</label>
                            <select id="mode-select" value={selectedMode} onChange={handleModeChange} className="mode-select">
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
                    
                    {/* Chord Extensions Dropdown */}
                    <div className="chord-extensions-control">
                        <label htmlFor="extensions-select">Chord Complexity:</label>
                        <select 
                            id="extensions-select" 
                            value={chordExtensionLevel} 
                            onChange={handleChordExtensionChange}
                            className="mode-select"
                        >
                            <option value="none">Basic Triads</option>
                            <option value="sevenths">Seventh Chords</option>
                            <option value="extended">Extended Chords</option>
                            <option value="full">Full Jazz Harmony</option>
                        </select>
                        <div className="control-hint">
                            {chordExtensionLevel === 'none' && 'Simple major and minor chords'}
                            {chordExtensionLevel === 'sevenths' && 'Adds 7th chords like dominant7 and minor7'}
                            {chordExtensionLevel === 'extended' && 'Includes 9th chords and more colors'}
                            {chordExtensionLevel === 'full' && 'Rich jazz harmony with advanced extensions'}
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
                            <span className="toggle-label">Use Inversions</span>
                        </label>
                        <span className="toggle-hint">Apply voice leading with slash chords</span>
                    </div>
                    
                    {/* Advanced options toggle */}
                    <div className="advanced-options-toggle">
                        <button 
                            onClick={toggleAdvancedOptions} 
                            className="toggle-button"
                        >
                            {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
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
                                        onChange={handleRhythmPatternChange}
                                        className="mode-select"
                                    >
                                        {Object.entries(rhythmPatterns).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    <div className="control-hint">
                                        Controls how long each chord is held
                                    </div>
                                </div>
                            </div>
                            
                            <div className="option-section">
                                <h3>Structural Patterns</h3>
                                <div className="pattern-control">
                                    <label htmlFor="pattern-select">Harmonic Pattern:</label>
                                    <select 
                                        id="pattern-select" 
                                        value={patternType} 
                                        onChange={handlePatternTypeChange}
                                        className="mode-select"
                                    >
                                        <option value="">No specific pattern</option>
                                        {Object.entries(harmonicPatterns).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    <div className="control-hint">
                                        Pre-defined harmonic patterns
                                    </div>
                                </div>
                                
                                <div className="chord-mode-toggle structural-toggle">
                                    <label className="toggle-container">
                                        <input
                                            type="checkbox"
                                            checked={useStructuralPattern}
                                            onChange={handleStructuralPatternToggle}
                                            className="chord-toggle-input"
                                            disabled={patternType !== ''}
                                        />
                                        <span className="toggle-label">Allow Structural Patterns</span>
                                    </label>
                                    <span className="toggle-hint">Occasionally use common patterns</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <button onClick={handleGenerate} className="generate-button">Generate Progression</button>
                </div>
            </div>
        </div>
    );
};

export default ChordGenerator;