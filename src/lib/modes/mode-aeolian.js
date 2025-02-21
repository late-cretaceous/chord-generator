// Aeolian (Natural Minor) mode definition with normalized transition probabilities
export const aeolian = {
    name: 'aeolian',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    chordQualities: {
        i: 'minor',
        ii: 'diminished',
        III: 'major',
        iv: 'minor',
        v: 'minor',
        VI: 'major',
        VII: 'major'
    },
    transitions: {
        i:   { i: 0.023, ii: 0.091, III: 0.159, iv: 0.182, v: 0.205, VI: 0.182, VII: 0.159 },
        ii:  { i: 0.212, ii: 0.030, III: 0.152, iv: 0.182, v: 0.242, VI: 0.121, VII: 0.091 },
        III: { i: 0.167, ii: 0.083, III: 0.028, iv: 0.194, v: 0.139, VI: 0.222, VII: 0.167 },
        iv:  { i: 0.200, ii: 0.086, III: 0.114, iv: 0.029, v: 0.257, VI: 0.171, VII: 0.143 },
        v:   { i: 0.257, ii: 0.057, III: 0.086, iv: 0.114, v: 0.029, VI: 0.200, VII: 0.229 },
        VI:  { i: 0.159, ii: 0.079, III: 0.132, iv: 0.159, v: 0.211, VI: 0.026, VII: 0.237 },
        VII: { i: 0.310, ii: 0.069, III: 0.138, iv: 0.103, v: 0.207, VI: 0.172, VII: 0.034 }
    },
    description: "The Aeolian mode, also known as the natural minor scale, has a dark, melancholic quality and is commonly used in rock, metal, and classical music."
};