// Dorian mode definition with normalized transition probabilities
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
        i:   { i: 0.029, ii: 0.200, III: 0.114, IV: 0.229, v: 0.229, vi: 0.086, VII: 0.114 },
        ii:  { i: 0.143, ii: 0.048, III: 0.143, IV: 0.190, v: 0.381, vi: 0.095, VII: 0.095 },
        III: { i: 0.276, ii: 0.103, III: 0.034, IV: 0.207, v: 0.138, vi: 0.069, VII: 0.241 },
        IV:  { i: 0.259, ii: 0.111, III: 0.111, IV: 0.037, v: 0.296, vi: 0.074, VII: 0.111 },
        v:   { i: 0.276, ii: 0.138, III: 0.103, IV: 0.103, v: 0.034, vi: 0.069, VII: 0.276 },
        vi:  { i: 0.269, ii: 0.077, III: 0.115, IV: 0.077, v: 0.308, vi: 0.038, VII: 0.115 },
        VII: { i: 0.300, ii: 0.100, III: 0.133, IV: 0.100, v: 0.233, vi: 0.067, VII: 0.033 }
    },
    description: "The Dorian mode is a minor mode with a major sixth. It has a contemplative, somewhat melancholic sound with a slight brightness due to its raised sixth."
};