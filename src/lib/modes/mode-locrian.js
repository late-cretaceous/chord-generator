// Locrian mode definition with normalized transition probabilities
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
        i:   { i: 0.025, II: 0.225, iii: 0.125, iv: 0.150, V: 0.200, VI: 0.175, vii: 0.100 },
        II:  { i: 0.194, II: 0.028, iii: 0.167, iv: 0.139, V: 0.222, VI: 0.167, vii: 0.083 },
        iii: { i: 0.167, II: 0.194, iii: 0.028, iv: 0.194, V: 0.139, VI: 0.167, vii: 0.111 },
        iv:  { i: 0.206, II: 0.147, iii: 0.118, iv: 0.029, V: 0.235, VI: 0.176, vii: 0.088 },
        V:   { i: 0.242, II: 0.182, iii: 0.091, iv: 0.121, V: 0.030, VI: 0.212, vii: 0.152 },
        VI:  { i: 0.206, II: 0.176, iii: 0.118, iv: 0.147, V: 0.235, VI: 0.029, vii: 0.118 },
        vii: { i: 0.235, II: 0.206, iii: 0.088, iv: 0.118, V: 0.176, VI: 0.147, vii: 0.029 }
    },
    description: "The Locrian mode is the most dissonant of the modes, with a diminished fifth scale degree. It's rarely used as the main mode but can create intense, unstable atmospheres."
};