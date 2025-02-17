// Mixolydian mode definition
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
        I:   { I: 0.1, ii: 0.7, iii: 0.3, IV: 0.8, v: 0.7, vi: 0.5, VII: 0.9 },
        ii:  { I: 0.6, ii: 0.1, iii: 0.3, IV: 0.7, v: 0.8, vi: 0.4, VII: 0.7 },
        iii: { I: 0.7, ii: 0.4, iii: 0.1, IV: 0.6, v: 0.5, vi: 0.3, VII: 0.8 },
        IV:  { I: 0.7, ii: 0.5, iii: 0.2, IV: 0.1, v: 0.7, vi: 0.4, VII: 0.8 },
        v:   { I: 0.8, ii: 0.4, iii: 0.2, IV: 0.3, v: 0.1, vi: 0.5, VII: 0.9 },
        vi:  { I: 0.6, ii: 0.7, iii: 0.3, IV: 0.5, v: 0.6, vi: 0.1, VII: 0.8 },
        VII: { I: 0.9, ii: 0.3, iii: 0.2, IV: 0.6, v: 0.4, vi: 0.3, VII: 0.1 }
    },
    description: "The Mixolydian mode is similar to major but with a lowered seventh scale degree, giving it a bluesy, dominant quality common in rock and folk music."
};