import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import MidiExportButton from './MidiExportButton';

/**
 * Simplified ProgressionPlayer Component
 * Focused on essential playback controls and MIDI export
 * 
 * @param {Object} props Component props
 * @param {Array} props.progression Chord progression to play
 * @param {boolean} props.maintainPlayback Whether to maintain playback when progression changes
 * @param {Function} props.onTempoChange Callback when tempo changes
 * @param {number} props.tempo Current tempo in BPM
 * @param {boolean} props.simplified Whether to use simplified UI
 * @returns {JSX.Element} Rendered component
 */
const ProgressionPlayer = ({ 
    progression, 
    maintainPlayback = false, 
    onTempoChange, 
    tempo: currentTempo,
    simplified = false
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playFullChords, setPlayFullChords] = useState(true);
    const [tempo, setTempo] = useState('moderato');
    const [currentPreset, setCurrentPreset] = useState('strings');
    const [activeChordIndex, setActiveChordIndex] = useState(-1);
    const [showAdvancedControls, setShowAdvancedControls] = useState(false);

    // Effect to handle progression changes
    useEffect(() => {
        if (!maintainPlayback) {
            handleStop();
        } else if (isPlaying && progression.length > 0) {
            audioEngine.stopProgressionPlayback();
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, playFullChords, getTempoBPM());
            }, 50);
        }
    }, [progression, playFullChords]);

    // Cleanup effect
    useEffect(() => {
        return () => handleStop();
    }, []);

    // Convert tempo name to BPM value
    const getTempoBPM = () => {
        const tempoMarks = {
            largo: 50,
            adagio: 72,
            moderato: 108,
            allegro: 132,
            presto: 168
        };
        return tempoMarks[tempo] || 108;
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            handleStop();
        } else {
            handlePlay();
        }
    };

    const handlePlay = () => {
        if (progression.length > 0) {
            audioEngine.startProgressionPlayback(progression, playFullChords, getTempoBPM());
            setIsPlaying(true);
            setActiveChordIndex(0);
            
            // Set up a timer to update active chord based on durations
            const intervalTime = 100; // Check every 100ms
            let startTime = Date.now();
            const tempoInBPS = getTempoBPM() / 60; // Beats per second
            
            const timings = progression.map(chord => {
                const duration = chord.duration || 2;
                return duration / tempoInBPS * 1000; // Convert to milliseconds
            });
            
            let totalDuration = timings.reduce((sum, time) => sum + time, 0);
            
            const timer = setInterval(() => {
                if (!isPlaying) {
                    clearInterval(timer);
                    return;
                }
                
                const elapsed = Date.now() - startTime;
                
                // Determine which chord is active based on elapsed time
                let timeAccumulator = 0;
                let newActiveIndex = -1;
                
                for (let i = 0; i < timings.length; i++) {
                    timeAccumulator += timings[i];
                    if (elapsed < timeAccumulator) {
                        newActiveIndex = i;
                        break;
                    }
                }
                
                // Loop if reached the end
                if (newActiveIndex === -1 && elapsed >= totalDuration) {
                    startTime = Date.now();
                    newActiveIndex = 0;
                }
                
                if (newActiveIndex !== activeChordIndex) {
                    setActiveChordIndex(newActiveIndex);
                }
            }, intervalTime);
        }
    };

    const handleStop = () => {
        audioEngine.stopProgressionPlayback();
        setIsPlaying(false);
        setActiveChordIndex(-1);
    };

    const toggleAdvancedControls = () => {
        setShowAdvancedControls(!showAdvancedControls);
    };

    if (progression.length === 0) return null;

    // Simplified UI focused on just play and export
    if (simplified) {
        return (
            <div className="simplified-player">
                <div className="main-controls">
                    <button 
                        onClick={handlePlayPause}
                        className="play-button"
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    
                    <MidiExportButton 
                        progression={progression}
                        tempo={getTempoBPM()}
                    />
                </div>
                
                {/* Only show toggle for advanced controls */}
                <button 
                    onClick={toggleAdvancedControls} 
                    className="advanced-toggle-button"
                >
                    {showAdvancedControls ? "Hide Settings" : "Sound Settings"}
                </button>
                
                {/* Advanced controls that can be toggled */}
                {showAdvancedControls && (
                    <div className="advanced-player-controls">
                        <div className="tempo-control">
                            <select 
                                value={tempo}
                                onChange={(e) => {
                                    setTempo(e.target.value);
                                    if (onTempoChange) {
                                        onTempoChange(getTempoBPM());
                                    }
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
                        
                        <div className="chord-mode-toggle">
                            <label className="toggle-container">
                                <input
                                    type="checkbox"
                                    checked={playFullChords}
                                    onChange={() => setPlayFullChords(!playFullChords)}
                                    className="chord-toggle-input"
                                />
                                <span className="toggle-label">
                                    {playFullChords ? 'Full Chords' : 'Root Notes'}
                                </span>
                            </label>
                        </div>
                        
                        <div className="instrument-select">
                            <select
                                value={currentPreset}
                                onChange={(e) => {
                                    setCurrentPreset(e.target.value);
                                    audioEngine.setPreset(e.target.value);
                                }}
                                className="synth-select"
                            >
                                <option value="strings">Strings</option>
                                <option value="electric_piano">Electric Piano</option>
                                <option value="organ">Organ</option>
                                <option value="pad">Synth Pad</option>
                                <option value="brass">Brass</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Original full UI (kept for backwards compatibility)
    return (
        <div className="player-container">
            {/* Original player UI code here */}
            <div className="play-button-container">
                <button 
                    onClick={handlePlayPause}
                    className="play-button"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
            </div>
            
            <MidiExportButton 
                progression={progression}
                tempo={getTempoBPM()}
            />
        </div>
    );
};

export default ProgressionPlayer;