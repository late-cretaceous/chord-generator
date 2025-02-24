// lib/voicing.js
import { NOTES, pitchToMidi, midiToPitch } from './core';
import { resetMelodicState } from './melodic-state';
import { 
    calculateVoiceLeadingScore, 
    getInversionBias 
} from './voice-leading-analysis';

/**
 * Gets all possible inversions for a chord
 * @param {Object} chord - Chord object with notes array
 * @returns {Array} Array of inversion objects
 */
export function getInversions(chord) {
    if (!chord.notes || !chord.notes.length) return [];
    const inversions = [];
    const baseNotes = chord.notes.map(note => note.replace(/[0-9]/, '')); // Pitch classes: ["G", "B", "D"]
    const baseOctave = parseInt(chord.notes[0].slice(-1)); // e.g., 2 from "G2"
    
    for (let i = 0; i < baseNotes.length; i++) {
        const reorderedNotes = [...baseNotes.slice(i), ...baseNotes.slice(0, i)]; // e.g., ["D", "G", "B"]
        const notes = reorderedNotes.map(note => {
            const noteMidi = pitchToMidi(note, baseOctave); // All in same octave
            return midiToPitch(noteMidi);
        });
        inversions.push({
            inversion: i,
            bassNote: notes[0],
            notes
        });
    }
    
    console.log('Inversions for', chord.notes, ':', inversions);
    return inversions;
}

/**
 * Select the best inversion based on voice leading criteria
 * @param {Array} inversions - Array of possible inversions
 * @param {Array} previousChordNotes - Notes of the previous chord
 * @param {number} progressionLength - Total progression length
 * @param {number} chordIndex - Position in the progression
 * @param {Object} prevChordObj - Previous chord object
 * @param {Object} nextChordObj - Next chord object
 * @returns {Object} The best inversion
 */
function selectBestInversion(
    inversions, 
    previousChordNotes, 
    progressionLength, 
    chordIndex, 
    prevChordObj, 
    nextChordObj
) {
    if (!inversions.length) return null;
    if (!previousChordNotes || !previousChordNotes.length) return inversions[0];

    const weightedInversions = inversions.map(inv => {
        // Calculate voice leading score with enhanced melodic factors
        const score = calculateVoiceLeadingScore(
            previousChordNotes, 
            inv.notes, 
            progressionLength, 
            chordIndex,
            prevChordObj,
            nextChordObj
        ) + getInversionBias(inv.inversion, chordIndex, progressionLength);
        
        console.log('Inversion', inv.notes, 'Score:', score);
        return { ...inv, score };
    });

    // Sort by score (lower is better)
    return weightedInversions.sort((a, b) => a.score - b.score)[0];
}

/**
 * Assess whether an inversion would improve the progression
 * @param {Object} currentChord - Current chord object
 * @param {Object} previousChord - Previous chord object
 * @param {number} progressionLength - Total progression length
 * @param {number} chordIndex - Position in the progression
 * @param {Array} progression - Full progression array
 * @returns {Object} Assessment result with best inversion
 */
function assessInversionBenefit(
    currentChord, 
    previousChord, 
    progressionLength, 
    chordIndex,
    progression
) {
    if (!previousChord || !previousChord.notes.length) {
        console.log('No previous notes, skipping inversion');
        return { shouldInvert: false, bestInversion: null };
    }

    const inversions = getInversions(currentChord);
    if (!inversions.length) {
        console.log('No inversions available');
        return { shouldInvert: false, bestInversion: null };
    }

    // Get the next chord if available (for context-aware decisions)
    const nextChord = chordIndex < progression.length - 1 ? progression[chordIndex + 1] : null;
    
    // Calculate score for root position
    const rootScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        inversions[0].notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    );
    
    // Find best inversion with enhanced scoring
    const bestInversion = selectBestInversion(
        inversions, 
        previousChord.notes, 
        progressionLength, 
        chordIndex,
        previousChord,
        nextChord
    );
    
    const bestScore = calculateVoiceLeadingScore(
        previousChord.notes, 
        bestInversion.notes, 
        progressionLength,
        chordIndex,
        previousChord,
        nextChord
    );

    console.log(`Root Score: ${rootScore}, Best Score: ${bestScore}, Improvement: ${rootScore - bestScore}`);

    // Determine if inversion is worthwhile (lower threshold makes more inversions)
    const improvementThreshold = 0.8;
    const shouldInvert = (rootScore - bestScore) > improvementThreshold;

    return { shouldInvert, bestInversion };
}

/**
 * Format chord symbol with inversion notation
 * @param {string} root - Root note
 * @param {string} quality - Chord quality
 * @param {string} bassNote - Bass note
 * @returns {string} Formatted chord symbol
 */
export function formatInversionSymbol(root, quality, bassNote) {
    if (!bassNote || bassNote.startsWith(root)) return root + quality;
    return `${root}${quality}/${bassNote.replace(/[0-9]/, '')}`;
}

/**
 * Apply inversions to a progression with enhanced voice leading
 * @param {Array} progression - Array of chord objects
 * @returns {Array} Progression with optimized inversions
 */
export function applyProgressionInversions(progression) {
    if (!progression || progression.length === 0) return progression;

    const result = [];
    let previousChord = null;
    
    // Reset melodic state at the start of a new progression
    resetMelodicState();

    progression.forEach((chord, chordIndex) => {
        const { shouldInvert, bestInversion } = assessInversionBenefit(
            chord, 
            previousChord, 
            progression.length, 
            chordIndex,
            progression
        );

        if (shouldInvert && bestInversion && bestInversion.inversion !== 0) {
            result.push({
                root: chord.root,
                quality: chord.quality,
                bass: bestInversion.bassNote,
                notes: bestInversion.notes
            });
            previousChord = { ...chord, notes: bestInversion.notes };
        } else {
            result.push(chord);
            previousChord = chord;
        }
    });

    return result;
}