import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';
import SynthControls from './SynthControls';

const TEMPO_MARKS = {
  largo: 50,      // Very slow and broad
  adagio: 72,     // Slow and stately
  moderato: 108,  // Moderate speed
  allegro: 132,   // Fast and bright
  presto: 168     // Very fast
};

// Add maintainPlayback prop with default value of false
const ProgressionPlayer = ({ progression, maintainPlayback = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playFullChords, setPlayFullChords] = useState(false);
  const [tempo, setTempo] = useState('moderato');
  const [currentPreset, setCurrentPreset] = useState('strings');

  useEffect(() => {
    // Only stop playback if maintainPlayback is false
    if (!maintainPlayback) {
      handleStop();
    } else if (isPlaying && progression.length > 0) {
      // If maintainPlayback is true and we're already playing, start playing the new progression
      audioEngine.stopProgressionPlayback();
      setTimeout(() => {
        audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[tempo]);
      }, 50);
    }
  }, [progression]);

  useEffect(() => {
    return () => handleStop();
  }, []);

  const getTempoColor = () => {
    switch(tempo) {
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
      audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[tempo]);
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
    
    if (isPlaying) {
      handleStop();
      setTimeout(() => {
        audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[newTempo]);
        setIsPlaying(true);
      }, 100);
    }
  };

  const handlePresetChange = (preset) => {
    setCurrentPreset(preset);
    audioEngine.setPreset(preset);
    
    // If playing, briefly stop and restart to apply new preset
    if (isPlaying) {
      handleStop();
      setTimeout(() => {
        audioEngine.startProgressionPlayback(progression, playFullChords, TEMPO_MARKS[tempo]);
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
        audioEngine.startProgressionPlayback(progression, newChordMode, TEMPO_MARKS[tempo]);
        setIsPlaying(true);
      }, 100);
    } else {
      const sampleChord = progression[0] || 'C';
      setTimeout(() => {
        audioEngine.playChord(sampleChord, newChordMode, 0.5);
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
        
        <div className="tempo-control">
          <select 
            value={tempo}
            onChange={handleTempoChange}
            className="tempo-select"
            style={{ 
              borderColor: getTempoColor(),
              color: getTempoColor()
            }}
          >
            <option value="largo">Largo (Very Slow)</option>
            <option value="adagio">Adagio (Slow)</option>
            <option value="moderato">Moderato (Medium)</option>
            <option value="allegro">Allegro (Fast)</option>
            <option value="presto">Presto (Very Fast)</option>
          </select>
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