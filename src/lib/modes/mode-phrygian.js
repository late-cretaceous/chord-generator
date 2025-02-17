// Phrygian mode definition
export const phrygian = {
    name: 'phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    chordQualities: {
        i: 'minor',
        II: 'major',
        III: 'major',
        iv: 'minor',
        v: 'minor',
        VI: 'major',
        vii: 'diminished'
    },
    transitions: {
        i:   { i: 0.1, II: 0.5, III: 0.4, iv: 0.6, v: 0.5, VI: 0.4, vii: 0.2 },
        II:  { i: 0.6, II: 0.1, III: 0.4, iv: 0.3, v: 0.3, VI: 0.4, vii: 0.2 },
        III: { i: 0.5, II: 0.3, III: 0.1, iv: 0.6, v: 0.4, VI: 0.4, vii: 0.2 },
        iv:  { i: 0.6, II: 0.3, III: 0.3, iv: 0.1, v: 0.5, VI: 0.4, vii: 0.2 },
        v:   { i: 0.7, II: 0.4, III: 0.3, iv: 0.3, v: 0.1, VI: 0.4, vii: 0.3 },
        VI:  { i: 0.6, II: 0.3, III: 0.3, iv: 0.4, v: 0.4, VI: 0.1, vii: 0.2 },
        vii: { i: 0.6, II: 0.3, III: 0.2, iv: 0.3, v: 0.4, VI: 0.4, vii: 0.1 }
    },
    description: "The Phrygian mode has a distinctly Spanish or Middle Eastern flavor due to its lowered second scale degree. It has a dark, exotic sound."
};