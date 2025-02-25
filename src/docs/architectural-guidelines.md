# Updated Architectural Guidelines for Chord Progression Generator

This document outlines the architectural principles and separation of concerns to be followed throughout the development of the Chord Progression Generator application.

## Module Hierarchy

The application follows a strict hierarchical structure with clearly defined communication paths:

### 1. High-Level Coordinators
*Examples: `logic.js`*

- Act as the top-level API for client code
- Coordinate flow between major application domains
- **Rules**:
  - May only call other coordinators or Domain Managers
  - Must NEVER bypass domain managers to call their subordinate modules
  - Should not implement domain-specific logic directly

### 2. Domain Managers
*Examples: `voicing.js`, `audio.js`, `progression-generator.js`*

- Serve as the ONLY entry point to their domain's functionality
- Coordinate operations between their domain's utility modules
- **Rules**:
  - Responsible for ALL operations within their domain
  - May call their own utility modules or other domain managers
  - Should transform data as needed between domain boundaries
  - Must validate inputs and handle errors within their domain

### 3. Utility Modules
*Examples: `voice-leading-analysis.js`, `harmonic-rhythm.js`, `progression-patterns.js`*

- Provide specialized services within a specific domain
- Implement core algorithms and business logic
- **Rules**:
  - Should NEVER be called directly from outside their domain
  - Must be accessed through their parent domain manager
  - Should focus on a single responsibility
  - May only call other utilities within the same domain

### 4. Global Utilities
*Example: `core.js`*

- Provide foundational constants and functions used across multiple domains
- Implement common, fundamental operations needed broadly throughout the application
- **Rules**:
  - May be imported by both high-level coordinators and domain managers
  - Should focus on pure, stateless functions without domain-specific logic
  - Should not depend on any domain-specific modules
  - Should be truly foundational to warrant global access

> **Important**: `core.js` is the only designated global utility in the current architecture. All other utilities must adhere to the domain-specific utility rules above.

## Domain Boundaries

### Progression Domain (`logic.js`)
- Chord generation and selection
- Mode and key determination
- Progression structure and length
- Overall progression flow
- Chord extensions

### Structural Domain (`structural-progression.js`)
- Harmonic rhythm management (`harmonic-rhythm.js`)
- Harmonic patterns and sequences (`progression-patterns.js`)
- Duration normalization and application
- Pattern-based progression generation

### Voice Domain (`voicing.js`)
- Cadential patterns (`cadential-patterns.js`)
- Voice leading analysis (`voice-leading-analysis.js`)
- Melodic state management (`melodic-state.js`)
- Inversions and voice optimization
- Leading tone treatment
- ALL voice-related operations

### Audio Domain (`audio.js`)
- Synth communication
- Playback control
- Audio parameter management
- Sound generation

### UI Domain (React components)
- User interface rendering
- User interaction handling
- Visual representation of musical concepts

## Updated Domain Relationship Diagram

```
High-Level Coordinator
└── logic.js
    ├── progression-generator.js (domain manager)
    │   └── chord-extensions.js (utility)
    ├── structural-progression.js (domain manager)
    │   ├── harmonic-rhythm.js (utility)
    │   └── progression-patterns.js (utility)
    ├── voicing.js (domain manager)
    │   ├── voice-leading-analysis.js (utility)
    │   ├── melodic-state.js (utility)
    │   └── cadential-patterns.js (utility)
    └── audio.js (domain manager)
        └── SynthEngine.js (utility)

Global Utilities
└── core.js (accessible to all domains)
```

## Data Flow Principles

1. **Hierarchical Flow**: Data should flow down from coordinators to domain managers to utilities, and results should flow back up through the same path.

2. **Domain Transformation**: Domain managers are responsible for transforming data at domain boundaries to ensure proper encapsulation.

3. **Consistent Data Structures**: Use consistent object structures for musical concepts (chords, progressions, notes) across domain boundaries.

4. **Clear Interface Contracts**: Each module should have clear input/output specifications that don't leak implementation details.

## Common Architecture Violations to Avoid

If you encounter any of these patterns, refactor immediately:

1. **Domain Bypassing**: A high-level module imports a utility module from another domain
   - ❌ `logic.js` imports `harmonic-rhythm.js`
   - ✅ `logic.js` calls `structural-progression.js` which uses `harmonic-rhythm.js`

2. **Cross-domain Utility Access**: A utility module from one domain accessed by another domain
   - ❌ `voice-leading-analysis.js` used directly by `structural-progression.js`
   - ✅ `structural-progression.js` communicates with `voicing.js` which then uses `voice-leading-analysis.js`

3. **Functionality Duplication**: Similar functionality implemented in multiple places
   - ❌ Rhythm application logic in both `logic.js` and `structural-progression.js`
   - ✅ Rhythm application logic only in `structural-progression.js`

4. **Utility Exposure**: A domain's internal utilities are exposed to outside modules
   - ❌ Exporting `createRhythmPattern()` for use outside the structural domain
   - ✅ Encapsulating rhythm pattern creation within the structural domain

5. **Responsibility Leakage**: A high-level module manages low-level details
   - ❌ `logic.js` handling harmonic rhythm calculations
   - ✅ `logic.js` delegating ALL structural concerns to `structural-progression.js`

6. **Circular Dependencies**: Modules depending on each other directly or indirectly
   - ❌ `voice-leading-analysis.js` imports from `voicing.js`
   - ✅ Both modules import from utility modules or core constants

7. **Global Utility Proliferation**: Making multiple domain-specific utilities global
   - ❌ Making `chord-extensions.js` a global utility accessible everywhere
   - ✅ Keeping `chord-extensions.js` as a domain-specific utility accessed through its domain manager

## Special Note on core.js

Unlike other utilities, `core.js` serves as a global utility and may be imported by both high-level coordinators and domain managers. This exception is justified because:

1. It provides truly foundational music theory constants and functions needed across domains
2. It has no dependencies on other modules
3. Its functions are pure and stateless
4. It contains no domain-specific logic

Even with this exception, be judicious in what functionality goes into `core.js`. If a function is specific to a particular domain, it should be placed in a domain-specific utility.

## Code Style for Maintaining Separation

1. **Import Organization**: Group imports by domain for clarity
   ```javascript
   // High-level coordinators
   import { generateProgression } from './logic';
   
   // Global utilities
   import { NOTES, pitchToMidi } from './core';
   
   // Domain managers - only these should be imported from other domains
   import { optimizeVoiceLeading } from './voice/voicing';
   import { enhanceProgressionStructure } from './structural-progression';
   import { playProgression } from './audio';
   
   // Domain-internal utilities - never import these across domains
   import { analyzeCadentialPattern } from './voice-leading-analysis'; // WRONG
   ```

2. **Function Documentation**: Clearly indicate domain and allowed callers
   ```javascript
   /**
    * Optimizes voice leading for a chord progression
    * @domain Voice
    * @calledBy Logic domain only
    * @param {Array} progression - Chord progression to optimize
    * @returns {Array} Voice-optimized progression
    */
   export function optimizeVoiceLeading(progression) {
     // Implementation
   }
   ```

3. **Module Headers**: Include domain and responsibility annotations
   ```javascript
   /**
    * @module harmonic-rhythm
    * @domain Progression.Structural
    * @responsibility Manages harmonic rhythm patterns and duration assignments
    * @private Should only be used by structural-progression.js
    */
   ```

## Development Workflow

1. **Before Implementation**: Review module specifications to understand domain boundaries

2. **During Implementation**: Restrict imports to maintain proper hierarchical structure

3. **Code Review**: Verify separation of concerns and proper module communication

4. **Refactoring**: Address any architectural violations promptly before they propagate

## Pull Request Checklist

Before submitting changes, verify:

- [ ] Any added functionality exists in the appropriate module based on domain
- [ ] No domain boundary violations (high-level modules calling domain utilities)
- [ ] No duplicate implementations of the same functionality
- [ ] Clear input/output contracts for all new functions
- [ ] Consistent parameter and return value structures
- [ ] All imports follow the hierarchical structure (coordinators → domain managers → utilities)
- [ ] Updated module specifications reflect any functional changes
- [ ] Appropriate domain manager created for new functionality domains
- [ ] Careful use of `core.js` — only truly global functionality belongs there

## Maintenance and Evolution

As the application evolves:

1. Update this document when architectural decisions change
2. Ensure new modules fit within the existing domain structure
3. Consider refactoring if domains become too large or responsibilities blur
4. Maintain backward compatibility at domain boundaries when possible
5. Create new domain managers for distinct areas of functionality rather than expanding existing ones

## Example: Adding New Functionality

### ❌ Incorrect Approach
```javascript
// In logic.js (High-level coordinator)
import { createRhythmPattern } from './harmonic-rhythm';

export function generateProgression() {
  // Generate progression
  const rhythm = createRhythmPattern(4, 'waltz');
  // Apply rhythm directly in logic.js
}
```

### ✅ Correct Approach
```javascript
// In logic.js (High-level coordinator)
import { enhanceProgressionStructure } from './structural-progression';

export function generateProgression() {
  // Generate progression
  
  // Use the domain manager for structural features
  return enhanceProgressionStructure(progression, { 
    rhythmPattern: 'waltz' 
  });
}

// In structural-progression.js (Domain manager)
import { createRhythmPattern } from './harmonic-rhythm';

export function enhanceProgressionStructure(progression, options) {
  // Delegate to utility module for implementation details
  const rhythm = createRhythmPattern(progression.length, options.rhythmPattern);
  // Apply rhythm and return
}
```

This ensures that the high-level coordinator (`logic.js`) never directly accesses utility modules, maintaining proper separation of concerns and clear domain boundaries.