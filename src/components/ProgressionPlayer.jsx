import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import SynthControls from './SynthControls';
import MidiExportButton from './MidiExportButton';

const TEMPO_MARKS = {
    largo: 50,
    adagio: 72,
    moderato: 108,
    allegro: 132,
    presto: 168
};

const ProgressionPlayer = ({ progression, maintainPlayback = false, onTempoChange, tempo: currentTempo }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [playFullChords, setPlayFullChords] = useState(false);
    const [tempo, setTempo] = useState('moderato');
    const [currentPreset, setCurrentPreset] = useState('strings');

    useEffect(() => {
        if (!maintainPlayback) {
            handleStop();
        } else if (isPlaying && progression.length > 0) {
            audioEngine.stopProgressionPlayback();
            setTimeout(() => {
                const notesProgression = progression.map(chord => 
                    playFullChords ? chord.notes : [chord.bass] // Root/bass only if not full
                );
                audioEngine.startProgressionPlayback(notesProgression, playFullChords, TEMPO_MARKS[tempo]);
            }, 50);
        }
    }, [progression, playFullChords]);

    useEffect(() => {
        return () => handleStop();
    }, []);

    const getTempoColor = () => {
        switch (tempo) {
            case 'largo': return '#4a90e2';
            case 'adagio': return '#45b7d1';
            case 'moderato': return '#4aae8c';
            case 'allegro': return '#e2984a';
            case 'presto': return '#e24a4a';
            default: return '#4a90e2';
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            handleStop();
        } else {
            handlePlay();
        }
    };

    const handlePlay = () => {
        if (progression.length > 0) {
            const notesProgression = progression.map(chord => 
                playFullChords ? chord.notes : [chord.bass]
            );
            audioEngine.startProgressionPlayback(notesProgression, playFullChords, TEMPO_MARKS[tempo]);
            setIsPlaying(true);
        }
    };

    const handleStop = () => {
        audioEngine.stopProgressionPlayback();
        setIsPlaying(false);
    };

    const handleTempoChange = (e) => {
        const newTempo = e.target.value;
        setTempo(newTempo);
        
        if (onTempoChange) {
            onTempoChange(TEMPO_MARKS[newTempo]);
        }
        
        if (isPlaying) {
            handleStop();
            setTimeout(() => {
                const notesProgression = progression.map(chord => 
                    playFullChords ? chord.notes : [chord.bass]
                );
                audioEngine.startProgressionPlayback(notesProgression, playFullChords, TEMPO_MARKS[newTempo]);
                setIsPlaying(true);
            }, 100);
        }
    };

    const handlePresetChange = (preset) => {
        setCurrentPreset(preset);
        audioEngine.setPreset(preset);
        
        if (isPlaying) {
            handleStop();
            setTimeout(() => {
                const notesProgression = progression.map(chord => 
                    playFullChords ? chord.notes : [chord.bass]
                );
                audioEngine.startProgressionPlayback(notesProgression, playFullChords, TEMPO_MARKS[tempo]);
                setIsPlaying(true);
            }, 100);
        }
    };

    const toggleChordMode = (e) => {
        e.stopPropagation();
        const wasPlaying = isPlaying;
        if (isPlaying) {
            handleStop();
        }
        
        const newChordMode = !playFullChords;
        setPlayFullChords(newChordMode);
        
        if (wasPlaying) {
            setTimeout(() => {
                const notesProgression = progression.map(chord => 
                    newChordMode ? chord.notes : [chord.bass]
                );
                audioEngine.startProgressionPlayback(notesProgression, newChordMode, TEMPO_MARKS[tempo]);
                setIsPlaying(true);
            }, 100);
        } else {
            const sampleChord = progression[0] || { notes: ["C2", "E2", "G2"], bass: "C2" }; // Fallback
            setTimeout(() => {
                audioEngine.playChord(newChordMode ? sampleChord.notes : [sampleChord.bass], newChordMode, 0.5);
            }, 50);
        }
    };

    if (progression.length === 0) return null;

    return (
        <div className="player-container">
            <div className="player-flex-container">
                <SynthControls 
                    onPresetChange={handlePresetChange}
                    currentPreset={currentPreset}
                />
                
                <div className="player-controls-group">
                    <div className="tempo-control">
                        <select 
                            value={tempo}
                            onChange={handleTempoChange}
                            className="tempo-select"
                            style={{ borderColor: getTempoColor(), color: getTempoColor() }}
                        >
                            <option value="largo">Largo (Very Slow)</option>
                            <option value="adagio">Adagio (Slow)</option>
                            <option value="moderato">Moderato (Medium)</option>
                            <option value="allegro">Allegro (Fast)</option>
                            <option value="presto">Presto (Very Fast)</option>
                        </select>
                    </div>
                    
                    <MidiExportButton 
                        progression={progression}
                        tempo={TEMPO_MARKS[tempo]}
                    />
                </div>
                
                <div className="play-button-container">
                    <button 
                        onClick={handlePlayPause}
                        className="play-button"
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                </div>
                
                <div className="chord-mode-toggle">
                    <label className="toggle-container">
                        <input
                            type="checkbox"
                            checked={playFullChords}
                            onChange={toggleChordMode}
                            className="chord-toggle-input"
                        />
                        <span className="toggle-label">
                            {playFullChords ? 'Full Chords' : 'Root Notes'}
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ProgressionPlayer;