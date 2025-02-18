// src/components/PlayButton.jsx
import React from 'react';
import { audioEngine } from '../lib/audio';
import './ChordGenerator.css';  // Import the shared stylesheet

const PlayButton = ({ chord }) => {
    const handlePlay = () => {
        const note = chord.replace(/m|dim|aug|maj7|7/g, '');
        audioEngine.playNote(note, 4, 1);
    };

    return (
        <button 
            onClick={handlePlay}
            className="play-button"
            title={`Play ${chord}`}
        >
            ▶
        </button>
    );
};

export default PlayButton;