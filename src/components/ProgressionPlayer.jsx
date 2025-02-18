// src/components/ProgressionPlayer.jsx
import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import './ChordGenerator.css';

const ProgressionPlayer = ({ progression }) => {
    const [isPlaying, setIsPlaying] = useState(false);

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
            audioEngine.startProgressionPlayback(progression);
            setIsPlaying(true);
        }
    };

    const handleStop = () => {
        audioEngine.stopProgressionPlayback();
        setIsPlaying(false);
    };

    if (progression.length === 0) return null;

    return (
        <button 
            onClick={handlePlayPause}
            className="play-button"
        >
            {isPlaying ? '⏸' : '▶'}
        </button>
    );
};

export default ProgressionPlayer;