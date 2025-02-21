// Lydian mode definition with normalized transition probabilities
export const lydian = {
    name: 'lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    chordQualities: {
        I: 'major',
        II: 'major',
        iii: 'minor',
        iv: 'diminished',
        V: 'major',
        vi: 'minor',
        vii: 'minor'
    },
    transitions: {
        I:   { I: 0.029, II: 0.257, iii: 0.143, iv: 0.086, V: 0.229, vi: 0.171, vii: 0.086 },
        II:  { I: 0.226, II: 0.032, iii: 0.194, iv: 0.065, V: 0.258, vi: 0.129, vii: 0.097 },
        iii: { I: 0.200, II: 0.133, iii: 0.033, iv: 0.100, V: 0.267, vi: 0.233, vii: 0.133 },
        iv:  { I: 0.241, II: 0.103, iii: 0.138, iv: 0.034, V: 0.276, vi: 0.138, vii: 0.069 },
        V:   { I: 0.310, II: 0.138, iii: 0.103, iv: 0.069, V: 0.034, vi: 0.241, vii: 0.103 },
        vi:  { I: 0.188, II: 0.219, iii: 0.125, iv: 0.063, V: 0.250, vi: 0.031, vii: 0.125 },
        vii: { I: 0.276, II: 0.138, iii: 0.103, iv: 0.069, V: 0.241, vi: 0.138, vii: 0.034 }
    },
    description: "The Lydian mode is similar to major but with a raised fourth scale degree, giving it a bright, floating quality often used in film scores."
};