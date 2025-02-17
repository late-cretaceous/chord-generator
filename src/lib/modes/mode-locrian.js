// Locrian mode definition
export const locrian = {
    name: 'locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    chordQualities: {
        i: 'diminished',
        II: 'major',
        iii: 'minor',
        iv: 'minor',
        V: 'major',
        VI: 'major',
        vii: 'minor'
    },
    transitions: {
        i:   { i: 0.1, II: 0.9, iii: 0.5, iv: 0.6, V: 0.8, VI: 0.7, vii: 0.4 },
        II:  { i: 0.7, II: 0.1, iii: 0.6, iv: 0.5, V: 0.8, VI: 0.6, vii: 0.3 },
        iii: { i: 0.6, II: 0.7, iii: 0.1, iv: 0.7, V: 0.5, VI: 0.6, vii: 0.4 },
        iv:  { i: 0.7, II: 0.5, iii: 0.4, iv: 0.1, V: 0.8, VI: 0.6, vii: 0.3 },
        V:   { i: 0.8, II: 0.6, iii: 0.3, iv: 0.4, V: 0.1, VI: 0.7, vii: 0.5 },
        VI:  { i: 0.7, II: 0.6, iii: 0.4, iv: 0.5, V: 0.8, VI: 0.1, vii: 0.4 },
        vii: { i: 0.8, II: 0.7, iii: 0.3, iv: 0.4, V: 0.6, VI: 0.5, vii: 0.1 }
    },
    description: "The Locrian mode is the most dissonant of the modes, with a diminished fifth scale degree. It's rarely used as the main mode but can create intense, unstable atmospheres."
};