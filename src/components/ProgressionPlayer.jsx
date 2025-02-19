// src/components/ProgressionPlayer.jsx
import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import './ChordGenerator.css';

const ProgressionPlayer = ({ progression }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playFullChords, setPlayFullChords] = useState(false);

    useEffect(() => {
        // Stop playback if progression changes
        handleStop();
    }, [progression]);

    useEffect(() => {
        // Cleanup on unmount
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
        if (progression.length > 0) {
            audioEngine.startProgressionPlayback(progression, playFullChords);
            setIsPlaying(true);
        }
    };

    const handleStop = () => {
        audioEngine.stopProgressionPlayback();
        setIsPlaying(false);
    };

    const toggleChordMode = (e) => {
        // Prevent triggering play/pause when clicking the toggle
        e.stopPropagation();
        
        // If currently playing, restart with new mode
        const wasPlaying = isPlaying;
        if (isPlaying) {
            handleStop();
        }
        
        const newChordMode = !playFullChords;
        setPlayFullChords(newChordMode);
        
        // Resume playback if it was playing
        if (wasPlaying) {
            setTimeout(() => {
                audioEngine.startProgressionPlayback(progression, newChordMode);
                setIsPlaying(true);
            }, 100);
        }
        
        // Play a sample chord to demonstrate the new mode
        if (!wasPlaying) {
            // Just play one sample chord to demonstrate the mode
            const sampleChord = progression[0] || 'C';
            setTimeout(() => {
                audioEngine.playChord(sampleChord, newChordMode, 0.5);
            }, 50);
        }
    };

    if (progression.length === 0) return null;

    return (
        <div className="player-container">
            <button 
                onClick={handlePlayPause}
                className="play-button"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? '⏸' : '▶'}
            </button>
            
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
    );
};

export default ProgressionPlayer;