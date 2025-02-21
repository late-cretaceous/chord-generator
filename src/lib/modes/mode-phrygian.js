// Phrygian mode definition with correct chord qualities and normalized transition probabilities
export const phrygian = {
    name: 'phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    chordQualities: {
        i: 'minor',
        II: 'major',
        III: 'major',
        iv: 'minor',
        v: 'diminished',
        VI: 'major',
        vii: 'minor' 
    },
    transitions: {
        i:   { i: 0.037, II: 0.185, III: 0.148, iv: 0.222, v: 0.185, VI: 0.148, vii: 0.074 },
        II:  { i: 0.261, II: 0.043, III: 0.174, iv: 0.130, v: 0.130, VI: 0.174, vii: 0.087 },
        III: { i: 0.200, II: 0.120, III: 0.040, iv: 0.240, v: 0.160, VI: 0.160, vii: 0.080 },
        iv:  { i: 0.250, II: 0.125, III: 0.125, iv: 0.042, v: 0.208, VI: 0.167, vii: 0.083 },
        v:   { i: 0.280, II: 0.160, III: 0.120, iv: 0.120, v: 0.040, VI: 0.160, vii: 0.120 },
        VI:  { i: 0.261, II: 0.130, III: 0.130, iv: 0.174, v: 0.174, VI: 0.043, vii: 0.087 },
        vii: { i: 0.273, II: 0.136, III: 0.091, iv: 0.136, v: 0.182, VI: 0.182, vii: 0.045 }
    },
    description: "The Phrygian mode has a distinctly Spanish or Middle Eastern flavor due to its lowered second scale degree. It has a dark, exotic sound."
};