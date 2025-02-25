import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import SynthControls from './SynthControls';
import MidiExportButton from './MidiExportButton';

/**
 * Tempo definitions in BPM
 * Used for both display and timing calculations
 */
const TEMPO_MARKS = {
    largo: 50,
    adagio: 72,
    moderato: 108,
    allegro: 132,
    presto: 168
};

/**
 * ProgressionPlayer Component
 * Handles playback of chord progressions with variable durations
 * 
 * @param {Object} props Component props
 * @param {Array} props.progression Chord progression to play
 * @param {boolean} props.maintainPlayback Whether to maintain playback when progression changes
 * @param {Function} props.onTempoChange Callback when tempo changes
 * @param {number} props.tempo Current tempo in BPM
 * @returns {JSX.Element} Rendered component
 */
const ProgressionPlayer = ({ 
    progression, 
    maintainPlayback = false, 
    onTempoChange, 
    tempo: currentTempo 
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playFullChords, setPlayFullChords] = useState(false);
    const [tempo, setTempo] = useState('moderato');
    const [currentPreset, setCurrentPreset] = useState('strings');
    const [activeChordIndex, setActiveChordIndex] = useState(-1);

    // Effect to handle progression changes
    useEffect(() => {
        if (!maintainPlayback) {
            handleStop();
        } else if (isPlaying && progression.length > 0) {
            audioEngine.stopProgressionPlayback();
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[tempo]);
            }, 50);
        }
    }, [progression, playFullChords]);

    // Cleanup effect
    useEffect(() => {
        return () => handleStop();
    }, []);

    const getTempoColor = () => {
        switch (tempo) {
            case 'largo': return '#4a90e2';
            case 'adagio': return '#45b7d1';
            case 'moderato': return '#4aae8c';
            case 'allegro': return '#e2984a';
            case 'presto': return '#e24a4a';
            default: return '#4a90e2';
        }
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
            audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[tempo]);
            setIsPlaying(true);
            setActiveChordIndex(0);
            
            // Set up a timer to update active chord based on durations
            startActiveChordTimer();
        }
    };
    
    const startActiveChordTimer = () => {
        // Calculate when each chord should play
        const tempoInBPS = TEMPO_MARKS[tempo] / 60; // Beats per second
        let currentTime = 0;
        const chordTimings = [];
        
        progression.forEach(chord => {
            const duration = chord.duration || 2; // Default to 2 beats if no duration specified
            chordTimings.push({
                startTime: currentTime,
                endTime: currentTime + duration / tempoInBPS
            });
            currentTime += duration / tempoInBPS;
        });
        
        // Set up a timer to check which chord should be active
        const intervalTime = 100; // Check every 100ms
        let startTime = Date.now();
        
        const timer = setInterval(() => {
            if (!isPlaying) {
                clearInterval(timer);
                return;
            }
            
            const elapsedTime = (Date.now() - startTime) / 1000;
            
            // Find which chord should be active based on elapsed time
            let newActiveIndex = -1;
            for (let i = 0; i < chordTimings.length; i++) {
                if (elapsedTime >= chordTimings[i].startTime && 
                    elapsedTime < chordTimings[i].endTime) {
                    newActiveIndex = i;
                    break;
                }
            }
            
            // If we've reached the end, loop back
            if (newActiveIndex === -1 && elapsedTime >= currentTime) {
                startTime = Date.now();
                newActiveIndex = 0;
            }
            
            if (newActiveIndex !== activeChordIndex) {
                setActiveChordIndex(newActiveIndex);
            }
        }, intervalTime);
        
        return timer;
    };

    const handleStop = () => {
        audioEngine.stopProgressionPlayback();
        setIsPlaying(false);
        setActiveChordIndex(-1);
    };

    const handleTempoChange = (e) => {
        const newTempo = e.target.value;
        setTempo(newTempo);
        
        if (onTempoChange) {
            onTempoChange(TEMPO_MARKS[newTempo]);
        }
        
        if (isPlaying) {
            handleStop();
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[newTempo]);
                setIsPlaying(true);
                setActiveChordIndex(0);
                startActiveChordTimer();
            }, 100);
        }
    };

    const handlePresetChange = (preset) => {
        setCurrentPreset(preset);
        audioEngine.setPreset(preset);
        
        if (isPlaying) {
            handleStop();
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[tempo]);
                setIsPlaying(true);
                setActiveChordIndex(0);
                startActiveChordTimer();
            }, 100);
        }
    };

    const toggleChordMode = (e) => {
        e.stopPropagation();
        const wasPlaying = isPlaying;
        if (isPlaying) {
            handleStop();
        }
        
        const newChordMode = !playFullChords;
        setPlayFullChords(newChordMode);
        
        if (wasPlaying) {
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, newChordMode, TEMPO_MARKS[tempo]);
                setIsPlaying(true);
                setActiveChordIndex(0);
                startActiveChordTimer();
            }, 100);
        } else {
            const sampleChord = progression[0] || { notes: ["C2", "E2", "G2"], bass: "C2" }; // Fallback
            setTimeout(() => {
                audioEngine.playChord(newChordMode ? sampleChord.notes : [sampleChord.bass], newChordMode, 0.5);
            }, 50);
        }
    };

    // Helper to render chord with duration indicator
    const renderChordWithDuration = (chord, index) => {
        const isActive = index === activeChordIndex;
        const duration = chord.duration || 2; // Default to 2 beats if not specified
        
        // Calculate width based on duration
        const baseWidth = 60; // Base width in pixels
        const width = Math.max(baseWidth, baseWidth * Math.sqrt(duration));
        
        return (
            <div 
                key={index} 
                className={`chord ${isActive ? 'chord-active' : ''}`}
                style={{
                    width: `${width}px`,
                    backgroundColor: isActive ? '#e2f0ff' : '#f0f0f0',
                    borderColor: isActive ? '#4a90e2' : '#ddd'
                }}
            >
                <div className="chord-symbol">{formatChord(chord)}</div>
                {duration !== 2 && (
                    <div className="chord-duration">{duration.toFixed(1)}x</div>
                )}
            </div>
        );
    };
    
    // Format chord display
    const formatChord = (chord) => {
        if (!chord || typeof chord !== 'object') return chord;
        // Ensure quality is normalized
        const quality = chord.quality || '';
        const base = `${chord.root}${quality}`;
        if (chord.bass && chord.bass !== `${chord.root}2`) {
            const bassNote = chord.bass.replace(/[0-9]/, '');
            return <>{base}<span className="chord-inversion">/{bassNote}</span></>;
        }
        return base;
    };

    if (progression.length === 0) return null;

    return (
        <div className="player-container">
            <div className="player-flex-container">
                <SynthControls 
                    onPresetChange={handlePresetChange}
                    currentPreset={currentPreset}
                />
                
                <div className="player-controls-group">
                    <div className="tempo-control">
                        <select 
                            value={tempo}
                            onChange={handleTempoChange}
                            className="tempo-select"
                            style={{ borderColor: getTempoColor(), color: getTempoColor() }}
                        >
                            <option value="largo">Largo (Very Slow)</option>
                            <option value="adagio">Adagio (Slow)</option>
                            <option value="moderato">Moderato (Medium)</option>
                            <option value="allegro">Allegro (Fast)</option>
                            <option value="presto">Presto (Very Fast)</option>
                        </select>
                    </div>
                    
                    <MidiExportButton 
                        progression={progression}
                        tempo={TEMPO_MARKS[tempo]}
                    />
                </div>
                
                <div className="progression-display">
                    <div className="chord-container">
                        {progression.map((chord, index) => renderChordWithDuration(chord, index))}
                    </div>
                </div>
                
                <div className="play-button-container">
                    <button 
                        onClick={handlePlayPause}
                        className="play-button"
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                </div>
                
                <div className="chord-mode-toggle">
                    <label className="toggle-container">
                        <input
                            type="checkbox"
                            checked={playFullChords}
                            onChange={toggleChordMode}
                            className="chord-toggle-input"
                        />
                        <span className="toggle-label">
                            {playFullChords ? 'Full Chords' : 'Root Notes'}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ProgressionPlayer;