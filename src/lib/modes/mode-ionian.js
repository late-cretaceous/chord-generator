// Ionian (Major) mode definition with normalized transition probabilities
export const ionian = {
    name: 'ionian',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    chordQualities: {
        I: 'major',
        ii: 'minor',
        iii: 'minor',
        IV: 'major',
        V: 'major',
        vi: 'minor',
        vii: 'diminished'
    },
    transitions: {
        I:   { I: 0.026, ii: 0.211, iii: 0.079, IV: 0.237, V: 0.237, vi: 0.158, vii: 0.053 },
        ii:  { I: 0.095, ii: 0.048, iii: 0.095, IV: 0.143, V: 0.429, vi: 0.143, vii: 0.048 },
        iii: { I: 0.077, ii: 0.115, iii: 0.038, IV: 0.269, V: 0.115, vi: 0.308, vii: 0.077 },
        IV:  { I: 0.276, ii: 0.138, iii: 0.069, IV: 0.034, V: 0.310, vi: 0.103, vii: 0.034 },
        V:   { I: 0.333, ii: 0.111, iii: 0.074, IV: 0.111, V: 0.037, vi: 0.259, vii: 0.074 },
        vi:  { I: 0.111, ii: 0.296, iii: 0.074, IV: 0.259, V: 0.185, vi: 0.037, vii: 0.074 },
        vii: { I: 0.375, ii: 0.083, iii: 0.042, IV: 0.083, V: 0.333, vi: 0.083, vii: 0.042 }
    },
    description: "The Ionian mode is equivalent to the major scale. It has a bright, stable sound and is the most common mode in Western music."
};