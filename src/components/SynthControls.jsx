import React from 'react';
import { SYNTH_PRESETS } from '../lib/synth/presets';
import './ChordGenerator.css'; // Ensure we're using the shared CSS file

const SynthControls = ({ onPresetChange, currentPreset = 'strings' }) => {
    return (
        <div className="synth-controls">
            <div className="synth-control-row">
                <label className="synth-label">
                    Instrument:
                </label>
                <select
                    value={currentPreset}
                    onChange={(e) => onPresetChange(e.target.value)}
                    className="synth-select"
                >
                    {Object.entries(SYNTH_PRESETS).map(([key, { name }]) => (
                        <option key={key} value={key}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default SynthControls;