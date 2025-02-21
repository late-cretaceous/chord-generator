// src/lib/synth/SynthEngine.js
import { SYNTH_PRESETS, DEFAULT_PRESET, getPreset } from './presets';

class SynthVoice {
    constructor(context) {
        this.context = context;
        this.oscillators = [];
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0;  // Start silent
        this.filter = this.context.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.connect(this.masterGain);
    }

    connect(destination) {
        this.masterGain.connect(destination);
    }

    start(frequency, preset, velocity = 0.3) {
        const osc = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        // Apply preset waveform and detune
        osc.type = preset.waveform;
        osc.frequency.value = frequency;
        osc.detune.value = preset.detune;
        
        // Set filter frequency from preset
        this.filter.frequency.value = preset.filterCutoff;
        
        osc.connect(gainNode);
        gainNode.connect(this.filter);
        
        const now = this.context.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(0, now);
        
        // Apply preset envelope with reduced velocity
        this.masterGain.gain.linearRampToValueAtTime(velocity * 0.5, now + preset.envelope.attack);
        
        osc.start(now);
        this.oscillators.push({ osc, gain: gainNode });
    }

    stop(preset, immediate = false) {
        const now = this.context.currentTime;
        const releaseTime = immediate ? 0.01 : preset.envelope.release;

        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + releaseTime);

        // Schedule oscillator stops
        this.oscillators.forEach(({ osc }) => {
            osc.stop(now + releaseTime + 0.01);
        });

        // Clean up after release
        setTimeout(() => {
            this.disconnect();
        }, (releaseTime + 0.02) * 1000);
    }

    disconnect() {
        this.oscillators.forEach(({ osc, gain }) => {
            osc.disconnect();
            gain.disconnect();
        });
        this.filter.disconnect();
        this.masterGain.disconnect();
        this.oscillators = [];
    }
}

class SynthEngine {
    constructor(audioContext) {
        this.context = audioContext;
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3;  // Set a lower master volume
        this.masterGain.connect(this.context.destination);
        this.activeVoices = new Map();
        this.currentPreset = getPreset(DEFAULT_PRESET);
    }

    setPreset(presetName) {
        const preset = getPreset(presetName);
        if (preset) {
            this.currentPreset = preset;
            // Stop all current voices when changing presets
            this.stopAllNotes(true);
        }
    }

    playNote(frequency) {
        // Stop any existing voice at this frequency
        this.stopNote(frequency);

        const voice = new SynthVoice(this.context);
        voice.connect(this.masterGain);
        voice.start(frequency, this.currentPreset);
        this.activeVoices.set(frequency, voice);
    }

    stopNote(frequency) {
        const voice = this.activeVoices.get(frequency);
        if (voice) {
            voice.stop(this.currentPreset);
            this.activeVoices.delete(frequency);
        }
    }

    stopAllNotes(immediate = false) {
        this.activeVoices.forEach((voice) => {
            voice.stop(this.currentPreset, immediate);
        });
        this.activeVoices.clear();
    }

    dispose() {
        this.stopAllNotes(true);
        if (this.masterGain) {
            this.masterGain.disconnect();
        }
    }
}

export { SynthEngine };