// lib/chord-extensions.js

/**
 * Applies chord extensions based on music theory principles with strict limits
 * @param {Array} romanNumerals - The progression in Roman numerals
 * @param {Object} mode - The mode being used
 * @param {string} chordExtensionLevel - The level of extensions to apply
 * @returns {Array} Enhanced Roman numerals with extensions
 */
export function applyChordExtensions(romanNumerals, mode, chordExtensionLevel) {
    if (chordExtensionLevel === 'none') return [...romanNumerals];
    
    const result = [...romanNumerals];
    
    // For "sevenths" mode, we'll ONLY add ONE extension to the V chord if present
    if (chordExtensionLevel === 'sevenths') {
        // Find V chord if present (also check lowercase v for minor keys)
        const vIndex = romanNumerals.findIndex(chord => chord === 'V' || chord === 'v');
        if (vIndex >= 0 && vIndex !== romanNumerals.length - 1) { // Don't extend final chord
            result[vIndex] = result[vIndex] === 'V' ? 'V7' : 'v7';
            console.log(`Applied extension to ${result[vIndex]} chord`);
        }
    }
    // For extended mode, allow up to 2 extensions with higher priority on V
    else if (chordExtensionLevel === 'extended') {
        let extensionsAdded = 0;
        const maxExtensions = Math.min(2, Math.floor(romanNumerals.length * 0.35));
        
        // Check for V chord first
        const vIndex = romanNumerals.findIndex(chord => chord === 'V' || chord === 'v');
        if (vIndex >= 0 && vIndex !== romanNumerals.length - 1 && extensionsAdded < maxExtensions) {
            result[vIndex] = result[vIndex] === 'V' ? 'V7' : 'v7';
            extensionsAdded++;
        }
        
        // Then check for other priority chords if we haven't hit our limit
        if (extensionsAdded < maxExtensions) {
            // Look for ii chord preceding V
            const iiIndex = romanNumerals.findIndex((chord, i) => 
                (chord === 'ii' || chord === 'iio') && 
                i + 1 < romanNumerals.length && 
                (romanNumerals[i+1] === 'V' || romanNumerals[i+1] === 'v' || 
                 romanNumerals[i+1] === 'V7' || romanNumerals[i+1] === 'v7')
            );
            
            if (iiIndex >= 0) {
                result[iiIndex] = result[iiIndex] === 'ii' ? 'ii7' : 'iio7';
                extensionsAdded++;
            }
        }
    }
    // For full jazz, allow a few more extensions
    else if (chordExtensionLevel === 'full') {
        let extensionsAdded = 0;
        const maxExtensions = Math.min(3, Math.floor(romanNumerals.length * 0.4));
        
        // Check for V chord first
        const vIndex = romanNumerals.findIndex(chord => chord === 'V' || chord === 'v');
        if (vIndex >= 0 && vIndex !== romanNumerals.length - 1 && extensionsAdded < maxExtensions) {
            // For full jazz, sometimes use 9th
            if (Math.random() > 0.7) {
                result[vIndex] = result[vIndex] === 'V' ? 'V9' : 'v9';
            } else {
                result[vIndex] = result[vIndex] === 'V' ? 'V7' : 'v7';
            }
            extensionsAdded++;
        }
        
        // Then check for ii chord
        if (extensionsAdded < maxExtensions) {
            const iiIndex = romanNumerals.findIndex(chord => chord === 'ii' || chord === 'iio');
            if (iiIndex >= 0) {
                result[iiIndex] = result[iiIndex] === 'ii' ? 'ii7' : 'iio7';
                extensionsAdded++;
            }
        }
        
        // Then maybe I or i chord
        if (extensionsAdded < maxExtensions) {
            const iIndex = romanNumerals.findIndex((chord, i) => 
                (chord === 'I' || chord === 'i') && i !== romanNumerals.length - 1
            );
            
            if (iIndex >= 0) {
                if (result[iIndex] === 'I') {
                    result[iIndex] = 'Imaj7';
                } else if (result[iIndex] === 'i') {
                    result[iIndex] = 'i7';
                }
                extensionsAdded++;
            }
        }
    }
    
    return result;
}