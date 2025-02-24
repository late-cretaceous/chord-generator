# Architectural Guidelines for Chord Progression Generator

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
*Examples: `voicing.js`, `audio.js`*

- Serve as the ONLY entry point to their domain's functionality
- Coordinate operations between their domain's utility modules
- **Rules**:
  - Responsible for ALL operations within their domain
  - May call their own utility modules or other domain managers
  - Should transform data as needed between domain boundaries
  - Must validate inputs and handle errors within their domain

### 3. Utility Modules
*Examples: `voice-leading-analysis.js`, `cadential-patterns.js`*

- Provide specialized services within a specific domain
- Implement core algorithms and business logic
- **Rules**:
  - Should NEVER be called directly from outside their domain
  - Must be accessed through their parent domain manager
  - Should focus on a single responsibility
  - May only call other utilities within the same domain

## Domain Boundaries

### Progression Domain (`logic.js`)
- Chord generation and selection
- Mode and key determination
- Progression structure and length
- Overall progression flow
- Chord extensions

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

## Data Flow Principles

1. **Hierarchical Flow**: Data should flow down from coordinators to domain managers to utilities, and results should flow back up through the same path.

2. **Domain Transformation**: Domain managers are responsible for transforming data at domain boundaries to ensure proper encapsulation.

3. **Consistent Data Structures**: Use consistent object structures for musical concepts (chords, progressions, notes) across domain boundaries.

4. **Clear Interface Contracts**: Each module should have clear input/output specifications that don't leak implementation details.

## Common Architecture Violations to Avoid

If you encounter any of these patterns, refactor immediately:

1. **Domain Bypassing**: A high-level module imports a utility module from another domain
   - ❌ `logic.js` imports `voice-leading-analysis.js`
   - ✅ `logic.js` calls `voicing.js` which uses `voice-leading-analysis.js`

2. **Functionality Duplication**: Similar functionality implemented in multiple places
   - ❌ Leading tone optimization in both `logic.js` and `voicing.js`
   - ✅ Leading tone optimization only in `voicing.js`

3. **Utility Exposure**: A domain's internal utilities are exposed to outside modules
   - ❌ Exporting `analyzeLeadingTone()` for use outside the voice domain
   - ✅ Encapsulating leading tone analysis within the voice domain

4. **Responsibility Leakage**: A high-level module manages low-level details
   - ❌ `logic.js` handling leading tone placement
   - ✅ `logic.js` delegating ALL voice concerns to `voicing.js`

5. **Circular Dependencies**: Modules depending on each other directly or indirectly
   - ❌ `voice-leading-analysis.js` imports from `voicing.js`
   - ✅ Both modules import from utility modules or core constants

## Code Style for Maintaining Separation

1. **Import Organization**: Group imports by domain for clarity
   ```javascript
   // High-level coordinators
   import { generateProgression } from './logic';
   
   // Domain managers - only these should be imported from other domains
   import { optimizeVoiceLeading } from './voicing';
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
    * @module voice-leading-analysis
    * @domain Voice
    * @responsibility Analyzes voice leading quality between chords
    * @private Should only be used by voicing.js
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
- [ ] Updated module specifications reflect any functional changes

## Maintenance and Evolution

As the application evolves:

1. Update this document when architectural decisions change
2. Ensure new modules fit within the existing domain structure
3. Consider refactoring if domains become too large or responsibilities blur
4. Maintain backward compatibility at domain boundaries when possible
