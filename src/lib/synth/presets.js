// src/lib/synth/presets.js

/**
 * Preset configurations for different synthesizer timbres
 */
export const SYNTH_PRESETS = {
    strings: {
        name: 'Strings',
        waveform: 'sawtooth',
        envelope: {
            attack: 0.2,
            release: 1.2
        },
        detune: 5,
        filterCutoff: 1200
    },

    electric_piano: {
        name: 'Electric Piano',
        waveform: 'triangle',
        envelope: {
            attack: 0.01,
            release: 0.8
        },
        detune: 0,
        filterCutoff: 2000
    },

    organ: {
        name: 'Organ',
        waveform: 'square',
        envelope: {
            attack: 0.02,
            release: 0.05
        },
        detune: 2,
        filterCutoff: 1800
    },

    pad: {
        name: 'Synth Pad',
        waveform: 'sine',
        envelope: {
            attack: 0.8,
            release: 2.5
        },
        detune: 8,
        filterCutoff: 800
    },

    sine: {
        name: 'Pure Tone',
        waveform: 'sine',
        envelope: {
            attack: 0.05,
            release: 0.3
        },
        detune: 0,
        filterCutoff: 2000
    },

    brass: {
        name: 'Brass',
        waveform: 'sawtooth',
        envelope: {
            attack: 0.1,
            release: 0.3
        },
        detune: 3,
        filterCutoff: 3000
    }
};

/**
 * Default preset to use if none is specified
 */
export const DEFAULT_PRESET = 'strings';

/**
 * Validates a preset configuration
 * @param {Object} preset - The preset configuration to validate
 * @returns {boolean} Whether the preset is valid
 */
export function validatePreset(preset) {
    return preset &&
        typeof preset === 'object' &&
        typeof preset.name === 'string' &&
        ['sine', 'square', 'sawtooth', 'triangle'].includes(preset.waveform) &&
        typeof preset.envelope === 'object' &&
        typeof preset.envelope.attack === 'number' &&
        typeof preset.envelope.release === 'number' &&
        typeof preset.detune === 'number' &&
        typeof preset.filterCutoff === 'number';
}

/**
 * Gets a preset by name with validation
 * @param {string} name - Name of the preset to retrieve
 * @returns {Object} The preset configuration or the default preset if not found
 */
export function getPreset(name) {
    const preset = SYNTH_PRESETS[name];
    return (preset && validatePreset(preset)) ? preset : SYNTH_PRESETS[DEFAULT_PRESET];
}