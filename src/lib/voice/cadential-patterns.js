// lib/cadential-patterns.js

/**
 * Generates pre-defined cadential patterns based on mode and context
 * @param {string} mode - Name of the mode (ionian, dorian, etc.)
 * @param {string} patternType - Type of cadence to generate (authentic, deceptive, etc.)
 * @returns {Array} Cadential pattern as Roman numerals
 */
export function getCadentialPattern(mode, patternType = 'authentic') {
    // Default patterns for different modes
    const patterns = {
        // Major mode patterns (ionian, lydian, mixolydian)
        major: {
            authentic: ['V', 'I'],            // Authentic cadence
            perfect: ['V', 'I'],              // Perfect authentic cadence (same in Roman numerals)
            plagal: ['IV', 'I'],              // Plagal cadence
            halfCadence: ['I', 'V'],          // Half cadence
            deceptive: ['V', 'vi'],           // Deceptive cadence
            picardyThird: ['V', 'I'],         // Picardy third (same in Roman, different in quality)
            extended: ['ii', 'V', 'I'],       // Extended authentic cadence
            elongated: ['IV', 'V', 'I']       // Elongated cadence
        },
        
        // Minor mode patterns (aeolian, dorian, phrygian)
        minor: {
            authentic: ['V', 'i'],            // Authentic cadence in minor
            perfect: ['V', 'i'],              // Perfect authentic cadence in minor
            plagal: ['iv', 'i'],              // Plagal cadence in minor
            halfCadence: ['i', 'V'],          // Half cadence in minor
            deceptive: ['V', 'VI'],           // Deceptive cadence in minor
            picardyThird: ['V', 'I'],         // Picardy third (minor to major)
            extended: ['iio', 'V', 'i'],      // Extended authentic cadence in minor
            elongated: ['iv', 'V', 'i'],      // Elongated cadence in minor
            natural: ['VII', 'i'],            // Natural minor cadence
            phrygian: ['II', 'i']             // Phrygian cadence
        },
        
        // Special cadences for specific modes
        mixolydian: {
            authentic: ['v', 'I'],            // Mixolydian authentic cadence
            extended: ['IV', 'v', 'I'],       // Extended mixolydian cadence
            plagal: ['IV', 'I'],              // Plagal cadence works well in mixolydian
            natural: ['VII', 'I']             // Flatted seventh to tonic
        },
        
        lydian: {
            authentic: ['V', 'I'],
            extended: ['II', 'V', 'I'],       // Lydian cadence with major II
            plagal: ['IV', 'I'],
            deceptive: ['V', 'vi']
        },
        
        dorian: {
            authentic: ['V', 'i'],
            extended: ['IV', 'V', 'i'],       // Dorian cadence with major IV
            plagal: ['IV', 'i'],              // Major IV to minor i
            natural: ['VII', 'i']             // Natural minor cadence option
        },
        
        phrygian: {
            authentic: ['V', 'i'],            // Traditional authentic (borrowing V)
            phrygian: ['II', 'i'],            // Characteristic Phrygian cadence
            extended: ['II', 'v', 'i'],       // With the characteristic II chord
            natural: ['VII', 'i'],            // Natural minor cadence option
            modal: ['iv', 'III', 'i']         // Modal phrygian cadence
        },
        
        locrian: {
            authentic: ['V', 'i'],            // Using borrowed V instead of diminished v
            locrian: ['II', 'i'],             // Characteristic cadence
            extended: ['VII', 'V', 'i'],      // Extended cadence
            modal: ['IV', 'v', 'i']           // Modal option
        }
    };
    
    // Determine if we're in a major or minor context
    let modeType = 'major';
    
    if (mode === 'aeolian' || mode === 'dorian' || mode === 'phrygian' || mode === 'locrian') {
        modeType = 'minor';
    }
    
    // Check if this mode has special cadences defined
    if (patterns[mode] && patterns[mode][patternType]) {
        return patterns[mode][patternType];
    }
    
    // If not, fall back to the general major/minor patterns
    return patterns[modeType][patternType] || patterns[modeType].authentic;
}

/**
 * Applies a cadential pattern to the end of a progression with some variation
 * @param {Array} progression - Existing progression as Roman numerals
 * @param {string} mode - Name of the mode
 * @param {string} patternType - Type of cadence to apply
 * @returns {Array} Modified progression with cadential pattern
 */
export function applyCadentialPattern(progression, mode, patternType = 'authentic') {
    if (!progression || progression.length < 2) {
        return progression;
    }
    
    // Sometimes preserve the original progression (25% chance)
    // This adds variety by occasionally not enforcing cadences
    if (Math.random() < 0.25) {
        return progression;
    }
    
    // Get the cadential pattern
    const cadence = getCadentialPattern(mode, patternType);
    
    // For very short progressions, just return the cadence
    if (progression.length <= cadence.length) {
        return cadence;
    }
    
    // Check if the progression already ends with a "valid" cadence
    const lastChord = progression[progression.length - 1];
    const penultimateChord = progression[progression.length - 2];
    
    // If progression already has a tonic ending, check if the cadence is valid
    if ((lastChord === 'I' || lastChord === 'i') && 
        cadenceAlreadyExists(penultimateChord, lastChord, mode)) {
        // 50% chance to keep existing valid cadence
        if (Math.random() < 0.5) {
            return progression;
        }
    }
    
    // Otherwise, replace the end of the progression with the cadence
    // But preserve more of the original progression
    const result = [...progression.slice(0, progression.length - cadence.length), ...cadence];
    
    return result;
}

/**
 * Checks if an existing cadence is already valid for the mode
 * @param {string} penultimateChord - Second-to-last chord
 * @param {string} lastChord - Last chord
 * @param {string} mode - Current mode
 * @returns {boolean} Whether the existing cadence is valid
 */
function cadenceAlreadyExists(penultimateChord, lastChord, mode) {
    // Common valid cadential movements
    const validCadences = {
        // Major modes
        'ionian': [
            { pre: 'V', post: 'I' },    // Authentic
            { pre: 'IV', post: 'I' },   // Plagal
            { pre: 'vii', post: 'I' }   // Leading tone
        ],
        'lydian': [
            { pre: 'V', post: 'I' },    // Authentic
            { pre: 'II', post: 'I' },   // Lydian cadence
            { pre: 'vii', post: 'I' }   // Leading tone
        ],
        'mixolydian': [
            { pre: 'v', post: 'I' },    // Modal authentic
            { pre: 'IV', post: 'I' },   // Plagal
            { pre: 'VII', post: 'I' }   // Subtonic
        ],
        
        // Minor modes
        'aeolian': [
            { pre: 'V', post: 'i' },    // Authentic
            { pre: 'iv', post: 'i' },   // Plagal
            { pre: 'VII', post: 'i' }   // Natural
        ],
        'dorian': [
            { pre: 'V', post: 'i' },    // Authentic
            { pre: 'IV', post: 'i' },   // Major subdominant
            { pre: 'VII', post: 'i' }   // Natural
        ],
        'phrygian': [
            { pre: 'V', post: 'i' },    // Borrowed authentic
            { pre: 'II', post: 'i' },   // Phrygian
            { pre: 'VII', post: 'i' },  // Natural
            { pre: 'iv', post: 'i' }    // Plagal
        ],
        'locrian': [
            { pre: 'V', post: 'i' },    // Borrowed authentic
            { pre: 'II', post: 'i' },   // From phrygian
            { pre: 'VI', post: 'i' }    // Locrian option
        ]
    };
    
    // Default to ionian/aeolian if mode not found
    const validOptions = validCadences[mode] || 
                        (lastChord === 'I' ? validCadences.ionian : validCadences.aeolian);
    
    // Check if the progression's ending matches any valid cadence
    return validOptions.some(cadence => 
        cadence.pre === penultimateChord && cadence.post === lastChord);
}

/**
 * Determines which cadential pattern would be most appropriate given the current progression
 * with randomization for variety
 * @param {Array} progression - Current progression as Roman numerals
 * @param {string} mode - Name of the mode
 * @returns {string} Recommended cadence type
 */
export function suggestCadentialPattern(progression, mode) {
    if (!progression || progression.length === 0) {
        return 'authentic';
    }
    
    // Get the last chord of the progression
    const lastChord = progression[progression.length - 1];
    
    // Add randomization to the cadence selection
    const random = Math.random();
    
    // Mode-specific cadence options with weighted probabilities
    const cadenceOptions = {
        'ionian': [
            { type: 'authentic', weight: 0.45 },
            { type: 'plagal', weight: 0.25 },
            { type: 'deceptive', weight: 0.15 },
            { type: 'extended', weight: 0.15 }
        ],
        'lydian': [
            { type: 'authentic', weight: 0.4 },
            { type: 'extended', weight: 0.3 },
            { type: 'plagal', weight: 0.2 },
            { type: 'deceptive', weight: 0.1 }
        ],
        'mixolydian': [
            { type: 'authentic', weight: 0.35 },
            { type: 'natural', weight: 0.25 },
            { type: 'plagal', weight: 0.25 },
            { type: 'extended', weight: 0.15 }
        ],
        'aeolian': [
            { type: 'authentic', weight: 0.4 },
            { type: 'natural', weight: 0.25 },
            { type: 'plagal', weight: 0.2 },
            { type: 'deceptive', weight: 0.15 }
        ],
        'dorian': [
            { type: 'authentic', weight: 0.35 },
            { type: 'extended', weight: 0.25 },
            { type: 'plagal', weight: 0.25 },
            { type: 'natural', weight: 0.15 }
        ],
        'phrygian': [
            { type: 'authentic', weight: 0.25 },
            { type: 'phrygian', weight: 0.35 },
            { type: 'natural', weight: 0.2 },
            { type: 'modal', weight: 0.2 }
        ],
        'locrian': [
            { type: 'authentic', weight: 0.3 },
            { type: 'locrian', weight: 0.3 },
            { type: 'modal', weight: 0.25 },
            { type: 'extended', weight: 0.15 }
        ]
    };
    
    // Default to ionian if mode not found
    const options = cadenceOptions[mode] || cadenceOptions.ionian;
    
    // Use weighted random selection
    let cumulativeWeight = 0;
    for (const option of options) {
        cumulativeWeight += option.weight;
        if (random <= cumulativeWeight) {
            return option.type;
        }
    }
    
    // Fallback to authentic cadence
    return 'authentic';
}

/**
 * Detects if a chord has a leading tone that should resolve properly
 * @param {string} romanNumeral - Roman numeral chord symbol
 * @param {string} mode - Name of the mode
 * @returns {boolean} Whether the chord has a leading tone that needs resolution
 */
export function hasLeadingTone(romanNumeral, mode) {
    // In major keys, V and viio contain the leading tone
    if (mode === 'ionian' || mode === 'lydian') {
        return (romanNumeral === 'V' || romanNumeral === 'V7' || 
                romanNumeral === 'V9' || romanNumeral === 'vii' || 
                romanNumeral === 'viio' || romanNumeral === 'vii7');
    }
    
    // In minor keys with raised leading tone, V and viio contain the leading tone
    if (mode === 'aeolian' || mode === 'dorian' || mode === 'phrygian') {
        return (romanNumeral === 'V' || romanNumeral === 'V7' || 
                romanNumeral === 'V9' || romanNumeral === 'vii' || 
                romanNumeral === 'viio' || romanNumeral === 'vii7');
    }
    
    // In mixolydian, there's no true leading tone (flat 7th)
    if (mode === 'mixolydian') {
        return false;
    }
    
    // Default case
    return (romanNumeral === 'V' || romanNumeral === 'V7' || 
            romanNumeral === 'V9' || romanNumeral === 'vii' || 
            romanNumeral === 'viio');
}