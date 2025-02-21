import React from 'react';
import { SYNTH_PRESETS } from '../lib/synth/presets';

const SynthControls = ({ onPresetChange, currentPreset = 'strings' }) => {
    return (
        <div className="flex flex-col gap-2 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                    Instrument:
                </label>
                <select
                    value={currentPreset}
                    onChange={(e) => onPresetChange(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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