// Dorian mode definition
export const dorian = {
    name: 'dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    chordQualities: {
        i: 'minor',
        ii: 'minor',
        III: 'major',
        IV: 'major',
        v: 'minor',
        vi: 'diminished',
        VII: 'major'
    },
    transitions: {
        i:   { i: 0.1, ii: 0.7, III: 0.4, IV: 0.8, v: 0.8, vi: 0.3, VII: 0.4 },
        ii:  { i: 0.3, ii: 0.1, III: 0.3, IV: 0.4, v: 0.8, vi: 0.2, VII: 0.2 },
        III: { i: 0.8, ii: 0.3, III: 0.1, IV: 0.6, v: 0.4, vi: 0.2, VII: 0.7 },
        IV:  { i: 0.7, ii: 0.3, III: 0.3, IV: 0.1, v: 0.8, vi: 0.2, VII: 0.3 },
        v:   { i: 0.8, ii: 0.4, III: 0.3, IV: 0.3, v: 0.1, vi: 0.2, VII: 0.8 },
        vi:  { i: 0.7, ii: 0.2, III: 0.3, IV: 0.2, v: 0.8, vi: 0.1, VII: 0.3 },
        VII: { i: 0.9, ii: 0.3, III: 0.4, IV: 0.3, v: 0.7, vi: 0.2, VII: 0.1 }
    },
    description: "The Dorian mode is a minor mode with a major sixth. It has a contemplative, somewhat melancholic sound with a slight brightness due to its raised sixth."
};