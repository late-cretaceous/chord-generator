import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import MidiExportButton from './MidiExportButton';

/**
 * Simplified ProgressionPlayer Component
 * Receives sound settings as props from parent component
 * 
 * @param {Object} props Component props
 * @param {Array} props.progression Chord progression to play
 * @param {boolean} props.maintainPlayback Whether to maintain playback when progression changes
 * @param {Function} props.onTempoChange Callback when tempo changes
 * @param {number} props.tempo Current tempo in BPM
 * @param {boolean} props.simplified Whether to use simplified UI
 * @param {boolean} props.playFullChords Whether to play full chords or just root notes
 * @param {string} props.currentPreset Current instrument preset
 * @param {Function} props.onPresetChange Callback for preset changes
 * @param {boolean} props.isDisabled Whether controls should be disabled
 * @returns {JSX.Element} Rendered component
 */
const ProgressionPlayer = ({ 
    progression, 
    maintainPlayback = false, 
    onTempoChange, 
    tempo = 108,
    simplified = false,
    playFullChords = true,
    currentPreset = 'strings',
    onPresetChange,
    isDisabled = false
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeChordIndex, setActiveChordIndex] = useState(-1);

    // Effect to handle progression changes
    useEffect(() => {
        if (!maintainPlayback) {
            handleStop();
        } else if (isPlaying && progression.length > 0) {
            audioEngine.stopProgressionPlayback();
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, playFullChords, tempo);
            }, 50);
        }
    }, [progression, playFullChords, tempo]);

    // Effect to handle instrument preset changes
    useEffect(() => {
        audioEngine.setPreset(currentPreset);
    }, [currentPreset]);

    // Cleanup effect
    useEffect(() => {
        return () => handleStop();
    }, []);

    const handlePlayPause = () => {
        if (isPlaying) {
            handleStop();
        } else {
            handlePlay();
        }
    };

    const handlePlay = () => {
        if (progression.length > 0 && !isDisabled) {
            audioEngine.startProgressionPlayback(progression, playFullChords, tempo);
            setIsPlaying(true);
            setActiveChordIndex(0);
            
            // Set up a timer to update active chord based on durations
            const intervalTime = 100; // Check every 100ms
            let startTime = Date.now();
            const tempoInBPS = tempo / 60; // Beats per second
            
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

    // We always render the component now, even if there's no progression

    return (
        <div className="simplified-player">
            <div className="controls-container">
                {/* Left side: MIDI Export button */}
                <div className="left-controls">
                    <MidiExportButton 
                        progression={progression}
                        tempo={tempo}
                        disabled={isDisabled}
                    />
                </div>
                
                {/* Center: Play button */}
                <div className="center-controls">
                    <button 
                        onClick={handlePlayPause}
                        className={`play-button ${isDisabled ? 'disabled' : ''}`}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        disabled={isDisabled}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                </div>
                
                {/* Right side: Empty to maintain layout */}
                <div className="right-controls">
                    {/* We removed sound settings button from here */}
                </div>
            </div>
        </div>
    );
};

export default ProgressionPlayer;