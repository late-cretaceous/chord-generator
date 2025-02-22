// src/components/MidiExportButton.jsx
import React from 'react';
import { downloadMidi } from '../lib/midi-export';

const MidiExportButton = ({ progression, tempo }) => {
    if (!progression || progression.length === 0) return null;

    const handleExport = () => {
        const filename = `progression-${new Date().getTime()}.mid`;
        downloadMidi(progression, filename, { tempo });
    };

    return (
        <button 
            onClick={handleExport}
            className="export-button"
            aria-label="Export MIDI"
        >
            Export MIDI
        </button>
    );
};

export default MidiExportButton;