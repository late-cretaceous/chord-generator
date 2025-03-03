// src/lib/synth/SynthEngine.js
import { getPreset, DEFAULT_PRESET } from './presets';

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
        try {
            const osc = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            // Apply preset waveform and detune
            osc.type = preset.waveform || 'sine'; // Fallback if missing
            osc.frequency.value = frequency;
            osc.detune.value = preset.detune || 0; // Fallback if missing
            
            // Set filter frequency from preset with fallback
            this.filter.frequency.value = preset.filterCutoff || 2000;
            
            osc.connect(gainNode);
            gainNode.connect(this.filter);
            
            const now = this.context.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(0, now);
            
            // Apply preset envelope with reduced velocity
            const attack = preset.envelope ? preset.envelope.attack || 0.1 : 0.1;
            this.masterGain.gain.linearRampToValueAtTime(velocity * 0.5, now + attack);
            
            osc.start(now);
            this.oscillators.push({ osc, gain: gainNode });
        } catch (e) {
            console.error("Error starting synth voice:", e);
        }
    }

    stop(preset, immediate = false) {
        try {
            const now = this.context.currentTime;
            // For immediate stop, use a very short release time
            const releaseTime = immediate ? 0.01 : 
                (preset && preset.envelope && preset.envelope.release) ? 
                preset.envelope.release : 0.3;

            // Cancel any scheduled values and force a quick release
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + releaseTime);

            // Schedule oscillator stops
            this.oscillators.forEach(({ osc }) => {
                try {
                    osc.stop(now + releaseTime + 0.01);
                } catch (e) {
                    // Ignore errors from already stopped oscillators
                }
            });

            // Clean up after release
            setTimeout(() => {
                this.disconnect();
            }, (releaseTime + 0.02) * 1000);
        } catch (e) {
            console.error("Error stopping synth voice:", e);
            // Force immediate disconnect on error
            this.disconnect();
        }
    }

    disconnect() {
        try {
            this.oscillators.forEach(({ osc, gain }) => {
                try {
                    osc.disconnect();
                } catch (e) {
                    // Ignore already disconnected oscillators
                }
                try {
                    gain.disconnect();
                } catch (e) {
                    // Ignore already disconnected gain nodes
                }
            });
            try {
                this.filter.disconnect();
            } catch (e) {
                // Ignore already disconnected filter
            }
            try {
                this.masterGain.disconnect();
            } catch (e) {
                // Ignore already disconnected master gain
            }
            this.oscillators = [];
        } catch (e) {
            console.error("Error disconnecting synth voice:", e);
        }
    }
}

class SynthEngine {
    constructor(audioContext) {
        this.context = audioContext;
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.3;  // Set a lower master volume
        this.masterGain.connect(this.context.destination);
        this.activeVoices = new Map();
        
        // Handle preset loading with fallbacks
        try {
            this.currentPreset = getPreset(DEFAULT_PRESET);
        } catch (e) {
            console.error("Failed to load preset, using default values", e);
            // Fallback preset if getPreset fails
            this.currentPreset = {
                name: 'Fallback',
                waveform: 'sine',
                envelope: {
                    attack: 0.1,
                    release: 0.3
                },
                detune: 0,
                filterCutoff: 2000
            };
        }
    }

    setPreset(presetName) {
        try {
            const preset = getPreset(presetName);
            if (preset) {
                this.currentPreset = preset;
                // Stop all current voices when changing presets
                this.stopAllNotes(true);
            }
        } catch (e) {
            console.error("Failed to set preset", e);
            // Continue with existing preset
        }
    }

    playNote(frequency) {
        try {
            // Stop any existing voice at this frequency
            this.stopNote(frequency);

            const voice = new SynthVoice(this.context);
            voice.connect(this.masterGain);
            voice.start(frequency, this.currentPreset);
            this.activeVoices.set(frequency, voice);
        } catch (e) {
            console.error("Error playing note:", e);
        }
    }

    stopNote(frequency) {
        try {
            const voice = this.activeVoices.get(frequency);
            if (voice) {
                voice.stop(this.currentPreset);
                this.activeVoices.delete(frequency);
            }
        } catch (e) {
            console.error("Error stopping note:", e);
            // Force removal from active voices on error
            this.activeVoices.delete(frequency);
        }
    }

    stopAllNotes(immediate = false) {
        try {
            // Create a copy of the keys to avoid modification during iteration
            const frequencies = Array.from(this.activeVoices.keys());
            
            frequencies.forEach((frequency) => {
                const voice = this.activeVoices.get(frequency);
                if (voice) {
                    try {
                        voice.stop(this.currentPreset, immediate);
                    } catch (e) {
                        console.error("Error stopping voice:", e);
                    }
                    this.activeVoices.delete(frequency);
                }
            });
        } catch (e) {
            console.error("Error stopping all notes:", e);
            // Force clear all voices on error
            this.activeVoices.clear();
        }
    }

    dispose() {
        try {
            this.stopAllNotes(true);
            if (this.masterGain) {
                this.masterGain.disconnect();
            }
        } catch (e) {
            console.error("Error disposing synth engine:", e);
        }
    }
}

export { SynthEngine };