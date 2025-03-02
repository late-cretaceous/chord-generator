// src/components/MidiExportButton.jsx
import React from 'react';
import { downloadMidi } from '../lib/midi-export';

const MidiExportButton = ({ progression, tempo, disabled = false }) => {
    const handleExport = () => {
        if (disabled || !progression || progression.length === 0) return;
        
        const filename = `progression-${new Date().getTime()}.mid`;
        downloadMidi(progression, filename, { tempo });
    };

    return (
        <button 
            onClick={handleExport}
            className={`export-button ${disabled ? 'disabled' : ''}`}
            aria-label="Export MIDI"
            disabled={disabled}
        >
            Export MIDI
        </button>
    );
};

export default MidiExportButton;