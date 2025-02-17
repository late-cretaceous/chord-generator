// Aeolian (Natural Minor) mode definition
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
        i:   { i: 0.1, ii: 0.4, III: 0.7, iv: 0.8, v: 0.9, VI: 0.8, VII: 0.7 },
        ii:  { i: 0.7, ii: 0.1, III: 0.5, iv: 0.6, v: 0.8, VI: 0.4, VII: 0.3 },
        III: { i: 0.6, ii: 0.3, III: 0.1, iv: 0.7, v: 0.5, VI: 0.8, VII: 0.6 },
        iv:  { i: 0.7, ii: 0.3, III: 0.4, iv: 0.1, v: 0.9, VI: 0.6, VII: 0.5 },
        v:   { i: 0.9, ii: 0.2, III: 0.3, iv: 0.4, v: 0.1, VI: 0.7, VII: 0.8 },
        VI:  { i: 0.6, ii: 0.3, III: 0.5, iv: 0.6, v: 0.8, VI: 0.1, VII: 0.9 },
        VII: { i: 0.9, ii: 0.2, III: 0.4, iv: 0.3, v: 0.6, VI: 0.5, VII: 0.1 }
    },
    description: "The Aeolian mode, also known as the natural minor scale, has a dark, melancholic quality and is commonly used in rock, metal, and classical music."
};