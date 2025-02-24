// src/lib/mode-enhancer.js

/**
 * Enhances a mode definition with extended chord types
 * 
 * @param {Object} mode - The mode definition to enhance
 * @param {string} enhancementLevel - Level of enhancement ('sevenths', 'extended', 'full')
 * @returns {Object} Enhanced mode with updated chord qualities
 */
export function enhanceMode(mode, enhancementLevel = 'sevenths') {
    if (!mode || !mode.chordQualities) return mode;
    
    // Create a deep copy to avoid modifying the original
    const enhancedMode = JSON.parse(JSON.stringify(mode));
    const qualities = enhancedMode.chordQualities;
    
    // Apply enhancements based on the mode type and name
    switch (mode.name.toLowerCase()) {
        case 'ionian':
            // Major key enhancements
            applyMajorKeyEnhancements(qualities, enhancementLevel);
            break;
            
        case 'lydian':
            // Lydian enhancements (major with #4)
            applyLydianEnhancements(qualities, enhancementLevel);
            break;
            
        case 'mixolydian':
            // Mixolydian enhancements (major with b7)
            applyMixolydianEnhancements(qualities, enhancementLevel);
            break;
            
        case 'aeolian':
        case 'dorian':
        case 'phrygian':
            // Minor mode enhancements
            applyMinorKeyEnhancements(qualities, enhancementLevel, mode.name.toLowerCase());
            break;
            
        case 'locrian':
            // Locrian (diminished) enhancements
            applyLocrianEnhancements(qualities, enhancementLevel);
            break;
    }
    
    return enhancedMode;
}

/**
 * Applies common major key chord enhancements
 */
function applyMajorKeyEnhancements(qualities, level) {
    // Basic seventh chords
    if (level === 'sevenths' || level === 'extended' || level === 'full') {
        // V is dominant7 in major keys
        if (qualities.V) qualities.V = 'dominant7';
        
        // ii is minor7 in major keys
        if (qualities.ii) qualities.ii = 'minor7';
        
        // I can be major7 in major keys
        if (qualities.I) qualities.I = 'major7';
        
        // IV is major7 in major keys
        if (qualities.IV) qualities.IV = 'major7';
        
        // iii and vi are minor7
        if (qualities.iii) qualities.iii = 'minor7';
        if (qualities.vi) qualities.vi = 'minor7';
        
        // vii is half-diminished
        if (qualities.vii) qualities.vii = 'halfDiminished7';
    }
    
    // Extended harmony
    if (level === 'extended' || level === 'full') {
        // Sometimes use dominant9 for V
        if (qualities.V && Math.random() > 0.6) qualities.V = 'dominant9';
        
        // Sometimes use major9 for I or IV
        if (qualities.I && Math.random() > 0.7) qualities.I = 'major9';
        if (qualities.IV && Math.random() > 0.7) qualities.IV = 'major9';
        
        // Sometimes use add9 for I or IV
        if (qualities.I && Math.random() > 0.8) qualities.I = 'add9';
    }
}

/**
 * Applies Lydian-specific enhancements (major with #4)
 */
function applyLydianEnhancements(qualities, level) {
    // Apply major key enhancements first
    applyMajorKeyEnhancements(qualities, level);
    
    // #4 specific overrides
    if (level === 'extended' || level === 'full') {
        // Lydian often uses major7 chords for IV (which is a #11 sound)
        if (qualities.IV) qualities.IV = 'augmented';
    }
}

/**
 * Applies Mixolydian-specific enhancements (major with b7)
 */
function applyMixolydianEnhancements(qualities, level) {
    // Apply major key enhancements first
    applyMajorKeyEnhancements(qualities, level);
    
    // b7 specific overrides
    if (level === 'sevenths' || level === 'extended' || level === 'full') {
        // I is often dominant7 in Mixolydian
        if (qualities.I) qualities.I = 'dominant7';
        
        // VII is major in Mixolydian
        if (qualities.VII) qualities.VII = 'major';
    }
}

/**
 * Applies common minor key chord enhancements
 */
function applyMinorKeyEnhancements(qualities, level, modeName) {
    // Basic seventh chords for minor keys
    if (level === 'sevenths' || level === 'extended' || level === 'full') {
        // i is minor7 in minor keys
        if (qualities.i) qualities.i = 'minor7';
        
        // VII is often dominant7 in minor keys (harmonic minor influence)
        if (qualities.VII) qualities.VII = 'dominant7';
        
        // III is major7 in minor keys
        if (qualities.III) qualities.III = 'major7';
        
        // ii is often half-diminished in minor
        if (qualities.ii) qualities.ii = 'halfDiminished7';
        
        // IV is minor7 in natural minor
        if (qualities.iv) qualities.iv = 'minor7';
        
        // v changes based on minor mode type
        if (qualities.v) {
            // Use dominant7 for v in harmonic minor contexts
            if (modeName === 'aeolian' && Math.random() > 0.5) {
                qualities.v = 'dominant7'; // Harmonic minor influence
            } else {
                qualities.v = 'minor7';
            }
        }
        
        // VI is major7
        if (qualities.VI) qualities.VI = 'major7';
    }
    
    // Extended harmony for minor keys
    if (level === 'extended' || level === 'full') {
        // Sometimes use minor9 for i
        if (qualities.i && Math.random() > 0.7) qualities.i = 'minor9';
        
        // Sometimes use dominant9 for V or VII
        if (qualities.V && Math.random() > 0.6) qualities.V = 'dominant9';
        if (qualities.VII && Math.random() > 0.6) qualities.VII = 'dominant9';
        
        // Add9 chords
        if (qualities.VI && Math.random() > 0.8) qualities.VI = 'add9';
    }
    
    // Dorian-specific adjustments
    if (modeName === 'dorian') {
        // IV is major in Dorian
        if (qualities.IV) qualities.IV = 'major7';
    }
    
    // Phrygian-specific adjustments
    if (modeName === 'phrygian') {
        // II is major in Phrygian
        if (qualities.II) qualities.II = 'major7';
    }
}

/**
 * Applies Locrian-specific enhancements (diminished tonic)
 */
function applyLocrianEnhancements(qualities, level) {
    if (level === 'sevenths' || level === 'extended' || level === 'full') {
        // i is half-diminished in Locrian
        if (qualities.i) qualities.i = 'halfDiminished7';
        
        // Other diatonic chords get seventh treatment
        if (qualities.ii) qualities.ii = 'minor7';
        if (qualities.III) qualities.III = 'major7';
        if (qualities.iv) qualities.iv = 'minor7';
        if (qualities.V) qualities.V = 'minor7';
        if (qualities.VI) qualities.VI = 'major7';
        if (qualities.VII) qualities.VII = 'major7';
    }
}