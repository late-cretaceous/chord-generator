// src/components/ProgressionTester.jsx
import React, { useState } from 'react';
import { 
  generateRandomProgressions, 
  exportProgressionTests 
} from '../lib/test/progression-tester';
import './ProgressionTester.css';

const ProgressionTester = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState(100);
  const [progress, setProgress] = useState(0);
  const [extensionLevel, setExtensionLevel] = useState('none');
  
  const handleTest = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Generate progressions in batches to avoid blocking the UI
      const batchSize = 20;
      const totalBatches = Math.ceil(count / batchSize);
      let allProgressions = [];
      
      // Process in batches with progress updates
      const processBatch = (batchIndex) => {
        if (batchIndex >= totalBatches) {
          // All batches completed
          exportProgressionTests(allProgressions);
          setIsGenerating(false);
          setProgress(100);
          return;
        }
        
        // Generate this batch with the specified extension level
        const batchCount = Math.min(batchSize, count - batchIndex * batchSize);
        const batchProgressions = generateRandomProgressions(batchCount, extensionLevel);
        allProgressions = [...allProgressions, ...batchProgressions];
        
        // Update progress
        const newProgress = Math.round(((batchIndex + 1) / totalBatches) * 100);
        setProgress(newProgress);
        
        // Schedule next batch
        setTimeout(() => processBatch(batchIndex + 1), 0);
      };
      
      // Start batch processing
      setTimeout(() => processBatch(0), 0);
    } catch (error) {
      console.error('Error running tests:', error);
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="progression-tester">
      <h3>Music Theory Test Generator</h3>
      <p className="tester-description">
        Generate random progressions in different modes (all in the key of C) for music theory analysis.
      </p>
      <div className="tester-controls">
        <label className="count-label">
          Number of progressions:
          <input 
            type="number" 
            value={count} 
            onChange={(e) => setCount(parseInt(e.target.value) || 100)} 
            min="1" 
            max="1000"
            className="count-input"
          />
        </label>
        
        <label className="extension-label">
          Chord type:
          <select
            value={extensionLevel}
            onChange={(e) => setExtensionLevel(e.target.value)}
            className="extension-select"
          >
            <option value="none">Basic Triads</option>
            <option value="sevenths">Seventh Chords</option>
            <option value="extended">Extended Chords</option>
            <option value="full">Full Jazz Harmony</option>
          </select>
        </label>
        
        <button 
          onClick={handleTest} 
          disabled={isGenerating}
          className="test-button"
        >
          {isGenerating ? 'Generating...' : 'Generate and Download Test File'}
        </button>
      </div>
      
      {isGenerating && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">{progress}% complete</div>
        </div>
      )}
      
      <p className="tester-note">
        This will generate a text file with chord progressions in various keys and modes for
        music theory review and critique.
      </p>
    </div>
  );
};

export default ProgressionTester;