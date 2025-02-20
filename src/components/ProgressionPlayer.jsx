import React, { useState, useEffect } from 'react';
import { audioEngine } from '../lib/audio';

const TEMPO_MARKS = {
  largo: 50,      // Very slow and broad
  adagio: 72,     // Slow and stately
  moderato: 108,  // Moderate speed
  allegro: 132,   // Fast and bright
  presto: 168     // Very fast
};

const ProgressionPlayer = ({ progression }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playFullChords, setPlayFullChords] = useState(false);
  const [tempo, setTempo] = useState('moderato');

  useEffect(() => {
    handleStop();
  }, [progression]);

  useEffect(() => {
    return () => handleStop();
  }, []);

  const getTempoColor = () => {
    switch(tempo) {
      case 'largo': return '#4a90e2';  // Cool blue for slow
      case 'adagio': return '#45b7d1'; // Light blue
      case 'moderato': return '#4aae8c'; // Teal
      case 'allegro': return '#e2984a'; // Warm orange
      case 'presto': return '#e24a4a';  // Hot red
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
      
      <button 
        onClick={handlePlayPause}
        className="play-button"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      
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
  );
};

export default ProgressionPlayer;