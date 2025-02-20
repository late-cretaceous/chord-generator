import React from 'react';
import { SYNTH_PRESETS } from '../lib/synth/SynthEngine';

const SynthControls = ({ onPresetChange, currentPreset = 'strings' }) => {
    return (
        <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                    Synth Type:
                </label>
                <select
                    value={currentPreset}
                    onChange={(e) => onPresetChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                    {Object.keys(SYNTH_PRESETS).map(preset => (
                        <option key={preset} value={preset}>
                            {preset.charAt(0).toUpperCase() + preset.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default SynthControls;