// Mixolydian mode definition with normalized transition probabilities
export const mixolydian = {
    name: 'mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    chordQualities: {
        I: 'major',
        ii: 'minor',
        iii: 'diminished',
        IV: 'major',
        v: 'minor',
        vi: 'minor',
        VII: 'major'
    },
    transitions: {
        I:   { I: 0.025, ii: 0.175, iii: 0.075, IV: 0.200, v: 0.175, vi: 0.125, VII: 0.225 },
        ii:  { I: 0.167, ii: 0.028, iii: 0.083, IV: 0.194, v: 0.222, vi: 0.111, VII: 0.194 },
        iii: { I: 0.206, ii: 0.118, iii: 0.029, IV: 0.176, v: 0.147, vi: 0.088, VII: 0.235 },
        IV:  { I: 0.205, ii: 0.147, iii: 0.059, IV: 0.029, v: 0.205, vi: 0.118, VII: 0.235 },
        v:   { I: 0.242, ii: 0.121, iii: 0.061, IV: 0.091, v: 0.030, vi: 0.152, VII: 0.273 },
        vi:  { I: 0.167, ii: 0.194, iii: 0.083, IV: 0.139, v: 0.167, vi: 0.028, VII: 0.222 },
        VII: { I: 0.375, ii: 0.125, iii: 0.083, IV: 0.250, v: 0.167, vi: 0.125, VII: 0.042 }
    },
    description: "The Mixolydian mode is similar to major but with a lowered seventh scale degree, giving it a bluesy, dominant quality common in rock and folk music."
};