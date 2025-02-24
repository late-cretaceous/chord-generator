// lib/chord-extensions.js

/**
 * Applies chord extensions based on music theory principles with style-appropriate patterns
 * @param {Array} romanNumerals - The progression in Roman numerals
 * @param {Object} mode - The mode being used
 * @param {string} chordExtensionLevel - The level of extensions to apply
 * @returns {Array} Enhanced Roman numerals with extensions
 */
export function applyChordExtensions(romanNumerals, mode, chordExtensionLevel) {
    // Return original progression if no extensions requested
    if (chordExtensionLevel === 'none' || !romanNumerals || romanNumerals.length === 0) {
        return [...romanNumerals];
    }
    
    // Create a deep copy to avoid modifying the original
    const result = [...romanNumerals];
    
    // Get mode type (major-based or minor-based) for appropriate extension handling
    const isMajorMode = isMajorBasedMode(mode);
    
    // Apply extensions based on the requested level
    switch (chordExtensionLevel) {
        case 'sevenths':
            applySeventhsExtensions(result, isMajorMode);
            break;
        case 'extended':
            applyExtendedHarmony(result, isMajorMode);
            break;
        case 'full':
            applyFullJazzHarmony(result, isMajorMode);
            break;
        default:
            console.warn(`Unknown chord extension level: ${chordExtensionLevel}`);
    }
    
    return result;
}

/**
 * Determines if a mode is major-based or minor-based
 * @param {Object} mode - The mode definition
 * @returns {boolean} True if major-based, false if minor-based
 */
function isMajorBasedMode(mode) {
    if (!mode || !mode.name) return true; // Default to major if no mode specified
    
    // Major-based modes: Ionian, Lydian, Mixolydian
    const majorModes = ['ionian', 'lydian', 'mixolydian'];
    return majorModes.includes(mode.name.toLowerCase());
}

/**
 * Applies basic seventh chords with music theory awareness
 * @param {Array} progression - The progression to modify
 * @param {boolean} isMajorMode - Whether the progression is in a major-based mode
 */
function applySeventhsExtensions(progression, isMajorMode) {
    // Track positions of common patterns
    const patterns = findCommonPatterns(progression, isMajorMode);
    
    // Limit the number of extensions based on progression length
    const maxExtensions = Math.max(1, Math.min(2, Math.floor(progression.length * 0.4)));
    let extensionsAdded = 0;
    
    // 1. First priority: Add seventh to V chords in cadential positions
    if (patterns.cadentialV.length > 0 && extensionsAdded < maxExtensions) {
        const vIndex = patterns.cadentialV[0]; // Use the first one found
        progression[vIndex] = progression[vIndex].replace(/V$|v$/, match => match === 'V' ? 'V7' : 'v7');
        extensionsAdded++;
    }
    
    // 2. Second priority: Add seventh to ii chords in ii-V patterns
    if (patterns.iiV.length > 0 && extensionsAdded < maxExtensions) {
        const iiIndex = patterns.iiV[0].ii; // Get the ii chord position
        progression[iiIndex] = progression[iiIndex].replace(/ii$|iio$/, match => match === 'ii' ? 'ii7' : 'iio7');
        extensionsAdded++;
    }
    
    // 3. If still under max and has IV-V, add to IV
    if (patterns.IVV.length > 0 && extensionsAdded < maxExtensions) {
        const ivIndex = patterns.IVV[0].iv; // Get the IV chord position
        if (isMajorMode) {
            progression[ivIndex] = progression[ivIndex].replace(/IV$/, 'IV7');
        } else {
            progression[ivIndex] = progression[ivIndex].replace(/iv$/, 'iv7');
        }
        extensionsAdded++;
    }
    
    // 4. Add seventh to appropriate additional chords if we're still under limit
    if (extensionsAdded < maxExtensions) {
        // Add another dominant 7th to another V if we have one
        const vIndices = findChords(progression, isMajorMode ? /^V$/ : /^v$/);
        for (let i = 0; i < vIndices.length && extensionsAdded < maxExtensions; i++) {
            // Skip the final chord and previously processed chords
            if (vIndices[i] === progression.length - 1 || patterns.cadentialV.includes(vIndices[i])) continue;
            
            progression[vIndices[i]] = isMajorMode ? 'V7' : 'v7';
            extensionsAdded++;
        }
    }
    
    // Don't modify the final chord in the "sevenths" level unless it's part of an authentic cadence
    const finalIdx = progression.length - 1;
    if (finalIdx > 0 && progression[finalIdx - 1].match(/^V7$|^v7$/) && 
        progression[finalIdx].match(/^I$|^i$/)) {
        // This is fine - keep the cadence
    } else if (progression[finalIdx] && progression[finalIdx].includes('7')) {
        progression[finalIdx] = progression[finalIdx].replace(/7.*$/, '');
    }
}

/**
 * Applies moderate extended harmony for more colorful progressions 
 * @param {Array} progression - The progression to modify
 * @param {boolean} isMajorMode - Whether the progression is in a major-based mode
 */
function applyExtendedHarmony(progression, isMajorMode) {
    // First apply basic sevenths
    applySeventhsExtensions(progression, isMajorMode);
    
    // Additional extensions for extended harmony
    const maxAdditionalExtensions = Math.min(2, Math.floor(progression.length * 0.3));
    let extensionsAdded = 0;
    
    // 1. Find I or i chords that aren't at the end and add maj7 or m7
    const iChords = findChords(progression, isMajorMode ? /^I$/ : /^i$/);
    for (let i = 0; i < iChords.length && extensionsAdded < maxAdditionalExtensions; i++) {
        // Skip the last chord in the progression most of the time
        if (iChords[i] === progression.length - 1 && Math.random() < 0.7) continue;
        
        // Add appropriate seventh based on mode
        if (isMajorMode) {
            progression[iChords[i]] = 'Imaj7';
        } else {
            progression[iChords[i]] = 'i7';
        }
        extensionsAdded++;
    }
    
    // 2. Sometimes upgrade V7 to V9 (about 30% chance if present)
    const v7Chords = findChords(progression, /^V7$|^v7$/);
    for (let i = 0; i < v7Chords.length && extensionsAdded < maxAdditionalExtensions; i++) {
        // Prioritize V7 chords in ii-V patterns for ninth extensions
        const isInCadence = v7Chords[i] < progression.length - 1 && 
                          progression[v7Chords[i] + 1].match(/^I$|^i$/);
                          
        // More likely to add a 9th if it's in a ii-V-I context
        if ((isInCadence && Math.random() < 0.4) || Math.random() < 0.25) {
            progression[v7Chords[i]] = progression[v7Chords[i]].replace('7', '9');
            extensionsAdded++;
        }
    }
    
    // 3. Add sevenths to vi or VI chords not already extended
    const viChords = findChords(progression, isMajorMode ? /^vi$/ : /^VI$/);
    for (let i = 0; i < viChords.length && extensionsAdded < maxAdditionalExtensions; i++) {
        if (isMajorMode) {
            progression[viChords[i]] = 'vi7';
        } else {
            progression[viChords[i]] = 'VI7';
        }
        extensionsAdded++;
    }
}

/**
 * Applies rich jazz harmony with advanced extensions and voice leading considerations
 * @param {Array} progression - The progression to modify
 * @param {boolean} isMajorMode - Whether the progression is in a major-based mode
 */
function applyFullJazzHarmony(progression, isMajorMode) {
    // First apply extended harmony as a base
    applyExtendedHarmony(progression, isMajorMode);
    
    // For jazz, we'll add even more color and possibly some substitutions
    const maxAdditionalExtensions = Math.floor(progression.length * 0.5);
    let extensionsAdded = 0;
    
    // 1. Consider more 9th chords
    for (let i = 0; i < progression.length && extensionsAdded < maxAdditionalExtensions; i++) {
        const chord = progression[i];
        
        // Skip if already has an extension beyond 7
        if (chord.includes('9') || chord.includes('maj7')) continue;
        
        // Add 9th extensions to appropriate chords
        if (chord === 'ii7' || chord === 'II7') {
            progression[i] = chord.replace('7', '9');
            extensionsAdded++;
        } 
        else if (chord === 'IV7' || chord === 'iv7') {
            progression[i] = chord.replace('7', Math.random() < 0.5 ? '9' : '7');
            extensionsAdded++;
        }
        // Maybe add maj9 to I chords
        else if (chord === 'Imaj7') {
            if (Math.random() < 0.4) {
                progression[i] = 'Imaj9';
                extensionsAdded++;
            }
        }
    }
    
    // 2. Add secondary dominants for more jazz color (V7/x chords)
    addSecondaryDominants(progression, isMajorMode, maxAdditionalExtensions - extensionsAdded);
    
    // 3. For full jazz, even final chords often get extensions
    if (progression.length > 0) {
        const lastChord = progression[progression.length - 1];
        if (lastChord === 'I') {
            progression[progression.length - 1] = Math.random() < 0.4 ? 'Imaj9' : 'Imaj7';
        } else if (lastChord === 'i') {
            progression[progression.length - 1] = Math.random() < 0.6 ? 'i7' : 'i9';
        }
    }
    
    // Jazz harmony frequently includes major 7th on the IV chord
    const ivChords = findChords(progression, isMajorMode ? /^IV$|^IV7$/ : /^iv$|^iv7$/);
    for (let i = 0; i < ivChords.length && extensionsAdded < maxAdditionalExtensions; i++) {
        if (isMajorMode && Math.random() < 0.6) {
            progression[ivChords[i]] = 'IVmaj7';
            extensionsAdded++;
        }
    }
}

/**
 * Finds positions of common chord patterns in a progression
 * @param {Array} progression - The chord progression
 * @param {boolean} isMajorMode - Whether the progression is in a major-based mode
 * @returns {Object} Positions of common patterns
 */
function findCommonPatterns(progression, isMajorMode) {
    const patterns = {
        // Positions of V or v chords followed by I or i (cadential pattern)
        cadentialV: [],
        
        // Positions of ii-V or iio-v patterns (as objects with ii and V indices)
        iiV: [],
        
        // Positions of IV-V or iv-v patterns (as objects with IV and V indices)
        IVV: []
    };
    
    // Define regex patterns based on mode
    const vPattern = isMajorMode ? /^V$/ : /^v$/;
    const iPattern = isMajorMode ? /^I$/ : /^i$/;
    const iiPattern = isMajorMode ? /^ii$/ : /^iio?$/;
    const ivPattern = isMajorMode ? /^IV$/ : /^iv$/;
    
    // Find cadential V chords
    for (let i = 0; i < progression.length - 1; i++) {
        if (vPattern.test(progression[i]) && iPattern.test(progression[i + 1])) {
            patterns.cadentialV.push(i);
        }
    }
    
    // Find ii-V patterns
    for (let i = 0; i < progression.length - 1; i++) {
        if (iiPattern.test(progression[i]) && vPattern.test(progression[i + 1])) {
            patterns.iiV.push({ ii: i, v: i + 1 });
        }
    }
    
    // Find IV-V patterns
    for (let i = 0; i < progression.length - 1; i++) {
        if (ivPattern.test(progression[i]) && vPattern.test(progression[i + 1])) {
            patterns.IVV.push({ iv: i, v: i + 1 });
        }
    }
    
    return patterns;
}

/**
 * Finds all occurrences of chords matching a pattern
 * @param {Array} progression - The chord progression
 * @param {RegExp} pattern - Regex pattern to match
 * @returns {Array} Indices of matching chords
 */
function findChords(progression, pattern) {
    return progression
        .map((chord, index) => pattern.test(chord) ? index : -1)
        .filter(index => index !== -1);
}

/**
 * Adds secondary dominants for a jazz feel
 * @param {Array} progression - The progression to modify
 * @param {boolean} isMajorMode - Whether the progression is in a major-based mode
 * @param {number} maxToAdd - Maximum number of dominants to add
 * @returns {number} Number of secondary dominants added
 */
function addSecondaryDominants(progression, isMajorMode, maxToAdd) {
    let added = 0;
    if (maxToAdd <= 0) return added;
    
    // Look for potential secondary dominant opportunities
    for (let i = 0; i < progression.length - 1 && added < maxToAdd; i++) {
        const nextChord = progression[i+1];
        
        // Skip if the target chord can't be tonicized or is the last chord
        if (i+1 === progression.length - 1 && Math.random() < 0.6) continue;
        if (!canBeTonicized(nextChord)) continue;
        
        // Get the proper secondary dominant for this target
        const secondaryDom = getSecondaryDominant(nextChord, isMajorMode);
        
        // If we have a chord that could become a secondary dominant
        if (secondaryDom && i > 0 && Math.random() < 0.35) {
            const currentChord = progression[i];
            
            // Skip if the current chord is already a dominant or extended
            if (currentChord.includes('7') || currentChord.includes('9')) continue;
            
            // Replace with secondary dominant
            progression[i] = secondaryDom;
            added++;
        }
    }
    
    return added;
}

/**
 * Checks if a chord can be approached by a secondary dominant
 * @param {string} chord - The chord to check
 * @returns {boolean} Whether the chord can be tonicized
 */
function canBeTonicized(chord) {
    // Almost any diatonic chord can be tonicized except diminished chords
    // and the tonic (in basic progressions)
    if (chord === 'I' || chord === 'i' || chord.includes('dim')) return false;
    
    // Remove any extensions before checking
    const baseChord = chord.replace(/[0-9].*$/, '');
    
    // These chords are commonly approached by secondary dominants
    const tonicizableChords = [
        'ii', 'iii', 'IV', 'V', 'vi', 'III', 'iv', 'v', 'VI', 'VII'
    ];
    
    return tonicizableChords.includes(baseChord);
}

/**
 * Gets the correct secondary dominant chord for a target chord
 * @param {string} targetChord - The chord being tonicized
 * @param {boolean} isMajorMode - Whether in a major mode
 * @returns {string} The secondary dominant chord symbol
 */
function getSecondaryDominant(targetChord, isMajorMode) {
    // Remove any extensions to get the base chord
    const baseChord = targetChord.replace(/[0-9].*$/, '');
    
    // Map of chord to its secondary dominant (V7/x)
    const secondaryDominantMap = {
        'ii': 'V7/ii', 'iii': 'V7/iii', 'IV': 'V7/IV', 
        'V': 'V7/V', 'vi': 'V7/vi', 'VII': 'V7/VII',
        'III': 'V7/III', 'iv': 'V7/iv', 'v': 'V7/v', 
        'VI': 'V7/VI', 'VII': 'V7/VII'
    };
    
    return secondaryDominantMap[baseChord] || null;
}