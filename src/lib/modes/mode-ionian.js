// Ionian (Major) mode definition
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
        I:   { I: 0.1, ii: 0.8, iii: 0.3, IV: 0.9, V: 0.9, vi: 0.6, vii: 0.2 },
        ii:  { I: 0.2, ii: 0.1, iii: 0.2, IV: 0.3, V: 0.9, vi: 0.3, vii: 0.1 },
        iii: { I: 0.2, ii: 0.3, iii: 0.1, IV: 0.7, V: 0.3, vi: 0.8, vii: 0.2 },
        IV:  { I: 0.8, ii: 0.4, iii: 0.2, IV: 0.1, V: 0.9, vi: 0.3, vii: 0.1 },
        V:   { I: 0.9, ii: 0.3, iii: 0.2, IV: 0.3, V: 0.1, vi: 0.7, vii: 0.2 },
        vi:  { I: 0.3, ii: 0.8, iii: 0.2, IV: 0.7, V: 0.5, vi: 0.1, vii: 0.2 },
        vii: { I: 0.9, ii: 0.2, iii: 0.1, IV: 0.2, V: 0.8, vi: 0.2, vii: 0.1 }
    },
    description: "The Ionian mode is equivalent to the major scale. It has a bright, stable sound and is the most common mode in Western music."
};