// src/lib/test/progression-tester.js
import { generateProgression } from '../logic';
import { MODES } from '../modes';
import { NOTES } from '../core';

/**
 * Generates a random progression with randomized parameters
 * @param {string} extensionLevel - Level of chord extensions to use
 * @returns {Object} Progression with metadata
 */
function generateRandomProgression(extensionLevel = 'none') {
  try {
    // Get random mode
    const modeNames = Object.keys(MODES);
    const randomModeIndex = Math.floor(Math.random() * modeNames.length);
    const randomMode = modeNames[randomModeIndex];
    
    // Get random length between 3 and 8
    const randomLength = Math.floor(Math.random() * 6) + 3; // 3 to 8
    
    // Fixed key of C
    const key = 'C';
    
    // Generate the progression
    const progression = generateProgression(
      randomLength,
      key,
      MODES[randomMode],
      true, // useInversions
      2, // rootOctave
      extensionLevel
    );
    
    // Return both the progression and the parameters used
    return {
      progression,
      params: {
        mode: randomMode,
        key: key,
        length: randomLength,
        extensionLevel: extensionLevel
      }
    };
  } catch (error) {
    console.error('Error generating random progression:', error);
    // Return a fallback minimal progression to avoid breaking the test
    return {
      progression: [{ root: 'C', quality: 'major', bass: 'C2', notes: ['C2', 'E2', 'G2'] }],
      params: {
        mode: 'ionian',
        key: 'C',
        length: 1,
        extensionLevel: extensionLevel,
        error: error.message // Include error information for debugging
      }
    };
  }
}

/**
 * Generates multiple random progressions
 * @param {number} count - Number of progressions to generate
 * @param {string} extensionLevel - Level of chord extensions to use
 * @returns {Array} Array of progression objects with metadata
 */
function generateRandomProgressions(count = 100, extensionLevel = 'none') {
  const progressions = [];
  
  for (let i = 0; i < count; i++) {
    try {
      progressions.push(generateRandomProgression(extensionLevel));
    } catch (e) {
      console.error('Error generating progression batch:', e);
    }
  }
  
  return progressions;
}

/**
 * Formats a chord for display
 * @param {Object} chord - Chord object
 * @returns {string} Formatted chord string
 */
function formatChord(chord) {
  if (!chord) return '';
  
  // Format based on quality
  let quality = '';
  switch (chord.quality) {
    case 'minor':
      quality = 'm';
      break;
    case 'diminished':
      quality = '°';
      break;
    case 'augmented':
      quality = '+';
      break;
    case 'dominant7':
      quality = '7';
      break;
    case 'major7':
      quality = 'maj7';
      break;
    case 'minor7':
      quality = 'm7';
      break;
    case 'halfDiminished7':
      quality = 'ø7';
      break;
    case 'diminished7':
      quality = '°7';
      break;
    case 'minorMajor7':
      quality = 'mM7';
      break;
    case 'add9':
      quality = 'add9';
      break;
    case 'dominant9':
      quality = '9';
      break;
    case 'major9':
      quality = 'maj9';
      break;
    case 'minor9':
      quality = 'm9';
      break;
    default:
      quality = chord.quality === 'major' ? '' : chord.quality;
  }
  
  // Handle inversions
  if (chord.bass && chord.bass !== `${chord.root}2`) {
    const bassNote = chord.bass.replace(/[0-9]/, '');
    return `${chord.root}${quality}/${bassNote}`;
  }
  
  return `${chord.root}${quality}`;
}

/**
 * Formats a progression for display
 * @param {Array} progression - Progression array
 * @returns {string} Formatted string representation
 */
function formatProgression(progression) {
  return progression.map(chord => formatChord(chord)).join(' - ');
}

/**
 * Formats a complete progression test result
 * @param {Object} progressionResult - Progression with metadata
 * @returns {string} Formatted string with parameters and chord progression
 */
function formatProgressionResult(progressionResult) {
  const { progression, params } = progressionResult;
  const formattedProgression = formatProgression(progression);
  
  let result = `Mode: ${params.mode}, Length: ${params.length}\n`;
  result += `Progression: ${formattedProgression}\n`;
  
  return result;
}

/**
 * Exports progression test results to a downloadable text file
 * @param {Array} progressionResults - Array of test results
 * @returns {void} Initiates file download
 */
function exportProgressionTests(progressionResults) {
  let content = 'Chord Progression Test Results\n';
  content += '===============================\n\n';
  content += `Generated on: ${new Date().toLocaleString()}\n`;
  content += `Total progressions: ${progressionResults.length}\n`;
  content += `Key: C\n`;
  
  const extensionLevel = progressionResults[0]?.params?.extensionLevel || 'none';
  content += `Chord Extensions: ${extensionLevel}\n\n`;
  
  progressionResults.forEach((result, index) => {
    content += `Test #${index + 1}\n`;
    content += `${'-'.repeat(40)}\n`;
    content += formatProgressionResult(result);
    content += '\n';
  });
  
  // Create a blob and download link
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `progression-tests-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export {
  generateRandomProgression,
  generateRandomProgressions,
  formatProgressionResult,
  exportProgressionTests
};