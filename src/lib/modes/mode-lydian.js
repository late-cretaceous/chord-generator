// Lydian mode definition
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
        I:   { I: 0.1, II: 0.9, iii: 0.5, iv: 0.3, V: 0.8, vi: 0.6, vii: 0.3 },
        II:  { I: 0.7, II: 0.1, iii: 0.6, iv: 0.2, V: 0.8, vi: 0.4, vii: 0.3 },
        iii: { I: 0.6, II: 0.4, iii: 0.1, iv: 0.3, V: 0.8, vi: 0.7, vii: 0.4 },
        iv:  { I: 0.7, II: 0.3, iii: 0.4, iv: 0.1, V: 0.8, vi: 0.4, vii: 0.2 },
        V:   { I: 0.9, II: 0.4, iii: 0.3, iv: 0.2, V: 0.1, vi: 0.7, vii: 0.3 },
        vi:  { I: 0.6, II: 0.7, iii: 0.4, iv: 0.2, V: 0.8, vi: 0.1, vii: 0.4 },
        vii: { I: 0.8, II: 0.4, iii: 0.3, iv: 0.2, V: 0.7, vi: 0.4, vii: 0.1 }
    },
    description: "The Lydian mode is similar to major but with a raised fourth scale degree, giving it a bright, floating quality often used in film scores."
};