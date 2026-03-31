# Technical Specification
## 3D STEP Generation for `BlindFlangeCalculator`

## 1. Purpose

This document defines the technical requirements, architecture, implementation plan, and acceptance criteria for adding **3D STEP generation of a configured blind flange** to the `BlindFlangeCalculator` tool.

The new feature must generate a valid 3D STEP model of the blind flange based on the calculator inputs and recommended/custom geometry, while following the same implementation philosophy already used elsewhere in the project for CAD generation: clear separation of UI, domain geometry, worker communication, and CAD export.

---

## 2. Background

The current `BlindFlangeCalculator` is a browser-based engineering calculator focused on:
- automatic PN class selection
- minimum and recommended thickness sizing
- bolt circle / bolt count / bolt size data
- gasket-related inputs
- weight estimate
- export/report utilities

The codebase for this tool already includes:
- `index.tsx`
- `components/`
- `utils.ts`
- `bolting.ts`
- `gasket.ts`
- `allowables.ts`
- `download.ts`
- `exportUtils.ts`
- manual check / report modules

This confirms the module is currently designed as a calculation/report utility, not as a CAD generator. A dedicated 3D generation subsystem must therefore be added rather than mixed into the existing calculation code. :contentReference[oaicite:1]{index=1}

---

## 3. Product Goal

Implement a new feature in `BlindFlangeCalculator` that allows the user to:
- configure a blind flange using the current calculator workflow
- generate a matching **3D STEP model**
- download the resulting `.step` file from the browser

The generated model must represent the selected or custom flange geometry, including at minimum:
- outer diameter
- plate thickness
- bolt circle
- bolt holes
- central blind plate body
- optional facing / gasket seating geometry in later phases

---

## 4. Scope

### 4.1 In Scope for MVP
- 3D STEP generation for configured blind flange
- worker-based CAD generation pipeline
- browser-side STEP export
- dedicated CAD geometry layer
- bolt hole pattern generation
- support for:
  - standard geometry mode
  - custom geometry mode
- export button and generation status UI
- validation for CAD-safe geometry

### 4.2 Out of Scope for MVP
- full raised-face / RTJ library
- stud/bolt 3D hardware generation
- embossed markings / text engraving
- FEM-ready meshing
- 3D viewer
- server-side CAD generation
- manufacturing drawings / 2D DXF
- flange pair assembly generation

---

## 5. Current-State Analysis

## 5.1 What the Current Tool Already Does
The existing tool is documented as a blind flange calculator for EN 13445-3 / EN 1092-1. It auto-selects PN class, computes minimum and recommended thickness, exposes bolt data, and gives a weight estimate. The documentation explicitly presents it as a preliminary sizing tool, not a final CAD or certified design package. :contentReference[oaicite:2]{index=2}

## 5.2 Current Runtime Composition
The main component imports and connects:
- `InputForm`
- `ResultsPanel`
- `ExportActions`
- `calculateBlindFlange`
- PN lookup helpers
- material and fastener datasets
- manual sizing / manual check support

That means the current integration point for STEP export should be **next to the existing export actions**, but the actual CAD generation must live outside the page component. :contentReference[oaicite:3]{index=3}

## 5.3 Architectural Conclusion
The tool already has solid domain calculation pieces, but no dedicated:
- CAD geometry layer
- CAD worker protocol
- worker client
- STEP export worker
- solid model builder

So the upgrade should **extend** the tool with a new `cad/` subsystem instead of pushing CAD logic into `utils.ts`, `index.tsx`, or `ExportActions.tsx`. :contentReference[oaicite:4]{index=4}

---

## 6. Design Principles

1. **Reuse architecture, not formulas blindly**
   - The calculator’s sizing logic should inform CAD geometry.
   - CAD generation must not depend on UI-only approximations or report formatting.

2. **Keep CAD code isolated**
   - React components should trigger generation, not construct solids.

3. **Use a worker**
   - STEP generation must run off the main thread.

4. **Use a dedicated geometry model**
   - A flange solid should be generated from explicit geometric parameters, not directly from display strings.

5. **Support both standard and custom configurations**
   - Standard mode uses EN 1092-1-derived geometry.
   - Custom mode uses editable design geometry from the current workflow.

6. **Build for extensibility**
   - The same subsystem should later support raised face, RTJ groove, bolt hardware, and optional nozzle/cover variants.

---

## 7. Recommended Target Architecture

## 7.1 Proposed Folder Structure

```text
BlindFlangeCalculator/
  components/
    InputForm.tsx
    ResultsPanel.tsx
    ExportActions.tsx
    StepExportPanel.tsx

  cad/
    geometry/
      compute-flange-geometry.ts
      build-blind-flange-solid.ts
      build-bolt-hole-pattern.ts
      build-facing-features.ts
      validation.ts
    hooks/
      useBlindFlangeCad.ts
    services/
      cad-worker-protocol.ts
      cad-worker-client.ts
      cad-worker.ts
    types/
      cad-types.ts

  allowables.ts
  bfTypes.ts
  bolting.ts
  custom.ts
  data.ts
  download.ts
  exportUtils.ts
  gasket.ts
  index.tsx
  manualCheck.ts
  manualCheckTypes.ts
  manualPdfReport.ts
  pdfText.ts
  utils.ts
````

## 7.2 Layer Responsibilities

### UI Layer

Responsible for:

* showing STEP export controls
* showing progress and errors
* calling hook methods

### State / Input Layer

Responsible for:

* current configuration from calculator inputs
* selected geometry mode
* custom or auto-selected flange geometry
* selected result to export

### Domain Geometry Layer

Responsible for:

* translating calculator result into CAD-safe geometry
* computing diameters, radii, thickness, bolt hole positions
* validating geometric consistency

### CAD Service Layer

Responsible for:

* worker lifecycle
* request/response mapping
* progress reporting
* returning STEP binary data

### CAD Worker Layer

Responsible for:

* loading CAD kernel
* building flange solid
* applying holes/features
* exporting STEP

---

## 8. Functional Requirements

## 8.1 Main Functional Requirement

The application shall provide a new export action that generates a 3D STEP model of the currently configured blind flange.

## 8.2 Geometry Sources

The STEP model shall be generated from the active design configuration:

* standard geometry result, or
* custom geometry result, or
* user-edited design configuration if present

## 8.3 Minimum Geometry for MVP

The 3D model shall include:

* circular blind flange body
* flange outer diameter
* flange thickness
* central blind face
* bolt circle hole pattern
* bolt hole diameters
* correct number of holes
* symmetry about central axis

## 8.4 Optional Geometry for Later Phases

* raised face
* flat face variant
* ring-type joint groove
* chamfers
* edge bevels
* bolt/stud solids
* gasket visualization body
* engraved metadata

---

## 9. Geometry Modeling Strategy

## 9.1 Base Shape

For MVP, the blind flange should be modeled as:

1. a solid circular disk with:

   * outer diameter `D`
   * thickness `t`

2. a bolt hole pattern cut through the body using:

   * bolt circle diameter `K`
   * hole count `n`
   * hole diameter `d2`

This is the most stable initial CAD strategy and matches the current calculator outputs, which already expose flange OD, thickness, bolt circle, bolt count, and bolt hole diameter through design/result structures. ([GitHub][2])

## 9.2 Geometry Source Priority

The CAD subsystem shall derive geometry in the following order:

1. user-defined `designConfig` if present
2. custom sizing result if active
3. standard calculator result
4. otherwise generation is blocked with a validation error

## 9.3 Derived Geometry Model

A dedicated CAD geometry structure shall be introduced to avoid mixing calculation objects with CAD objects.

Example:

```ts
export type BlindFlangeCadGeometry = {
  outerDiameter: number;
  thickness: number;
  boltCircleDiameter: number;
  boltHoleCount: number;
  boltHoleDiameter: number;
  innerReferenceDiameter?: number;
  gasketId?: number;
  gasketOd?: number;
  facingType?: 'FF' | 'RF' | 'RTJ' | 'CUSTOM';
  raisedFaceHeight?: number;
  raisedFaceDiameter?: number;
};
```

## 9.4 Bolt Hole Placement

Bolt holes shall be generated from:

* bolt count `n`
* bolt circle radius `K / 2`
* evenly distributed angular positions:

  * `angle_i = 2π * i / n`

Each hole shall be modeled as a through-cut cylinder normal to the flange face.

---

## 10. Recommended New Types

```ts
export type BlindFlangeStepRequest = {
  type: 'generate-step';
  requestId: string;
  geometry: BlindFlangeCadGeometry;
};

export type BlindFlangeWarmupRequest = {
  type: 'warmup';
  requestId: string;
};

export type BlindFlangeWorkerProgress = {
  type: 'progress';
  requestId: string;
  stage: 'init' | 'geometry' | 'export';
  done: number;
  total: number;
};

export type BlindFlangeWorkerResult =
  | {
      type: 'result';
      requestId: string;
      ok: true;
      payload: { step: ArrayBuffer };
    }
  | {
      type: 'result';
      requestId: string;
      ok: false;
      payload: { message: string; stack?: string };
    };
```

---

## 11. Required New Modules

## 11.1 `cad/types/cad-types.ts`

Contains CAD-specific types:

* geometry config
* worker messages
* export options
* validation result

## 11.2 `cad/services/cad-worker-protocol.ts`

Defines request/response contracts for UI ↔ worker messaging.

## 11.3 `cad/services/cad-worker-client.ts`

Responsibilities:

* create singleton worker
* send typed requests
* receive progress/result messages
* expose promise-based API

Required API:

```ts
warmupCadWorker(): Promise<void>
generateStepInWorker(
  geometry: BlindFlangeCadGeometry,
  options?: { onProgress?: (msg: BlindFlangeWorkerProgress) => void }
): Promise<ArrayBuffer>
```

## 11.4 `cad/services/cad-worker.ts`

Responsibilities:

* initialize CAD runtime
* build blind flange solid
* cut bolt holes
* export STEP blob/buffer
* report progress

## 11.5 `cad/geometry/compute-flange-geometry.ts`

Responsibilities:

* translate calculator result/design config into CAD geometry
* normalize standard and custom modes into one model
* set optional facing defaults
* reject incomplete data

## 11.6 `cad/geometry/build-bolt-hole-pattern.ts`

Responsibilities:

* compute bolt hole center coordinates
* return CAD cut primitives or geometry descriptors

## 11.7 `cad/geometry/build-blind-flange-solid.ts`

Responsibilities:

* build the disk
* apply optional face features
* cut bolt holes
* return final solid

## 11.8 `cad/geometry/build-facing-features.ts`

Responsibilities:

* phase 2+
* add raised face, ring groove, or custom seating face
* keep this separate from base disk generation

## 11.9 `cad/geometry/validation.ts`

Responsibilities:

* validate CAD geometry before build
* ensure no impossible or self-contradictory combinations

## 11.10 `cad/hooks/useBlindFlangeCad.ts`

Responsibilities:

* expose worker status
* expose export action
* keep React integration thin

## 11.11 `components/StepExportPanel.tsx`

Responsibilities:

* render STEP export button
* show generation status
* show error messages
* keep existing exports intact

---

## 12. UI Integration Requirements

## 12.1 Placement

The STEP action shall be integrated into or adjacent to the current `ExportActions` area, because that is already the export-related interaction point in the existing tool. ([GitHub][2])

## 12.2 Button Behavior

Required button:

* `Download .STEP (3D)`

States:

* idle
* warming up CAD kernel
* generating geometry
* exporting STEP
* failed
* completed

## 12.3 UX Requirements

The button shall:

* be disabled while generation is running
* show progress text
* show readable errors
* not block the rest of the UI

---

## 13. Validation Requirements

The system shall validate at minimum:

* outer diameter > 0
* thickness > 0
* bolt circle diameter > 0
* bolt hole count >= 1
* bolt hole diameter > 0
* bolt circle diameter < outer diameter
* hole diameter < bolt circle diameter
* bolt holes do not overlap each other
* bolt holes do not break outside the flange outer edge
* custom geometry is complete before export

Optional validation in later phases:

* raised face diameter constraints
* RTJ groove dimensions
* standard-specific facing constraints
* minimum ligament between hole and edge

---

## 14. Recommended CAD Build Logic

## 14.1 MVP Solid Pipeline

1. Validate geometry
2. Build base circular solid:

   * diameter = `outerDiameter`
   * thickness = `thickness`
3. Build bolt hole cylinders from bolt circle definition
4. Subtract all bolt holes from base solid
5. Export resulting solid to STEP

## 14.2 Phase 2 Solid Pipeline

Add:

* raised face ring
* flat face / raised face option switching
* groove features
* edge chamfers

## 14.3 Why This Approach

This flange is geometrically much simpler than a vessel head. It does not need a revolve-based profile as a primary strategy. The most stable implementation is:

* one solid disk
* repeated patterned cuts
* optional local face features

That makes the blind flange a better fit for a primitive-plus-boolean pipeline than the head geometry.

---

## 15. Recommended Internal API

```ts
export function computeBlindFlangeCadGeometry(
  source: {
    result?: CalculationResult | null;
    customResult?: CalculationResult | null;
    designConfig?: DesignConfiguration | null;
    gasketFacing?: GasketFacing;
  }
): BlindFlangeCadGeometry;

export function validateBlindFlangeCadGeometry(
  geometry: BlindFlangeCadGeometry
): string[];

export function buildBlindFlangeSolid(
  geometry: BlindFlangeCadGeometry
): unknown;

export async function warmupCadWorker(): Promise<void>;

export async function generateStepInWorker(
  geometry: BlindFlangeCadGeometry,
  options?: {
    onProgress?: (msg: BlindFlangeWorkerProgress) => void;
  }
): Promise<ArrayBuffer>;
```

---

## 16. Implementation Plan

## Phase 1 — CAD Infrastructure

### Objective

Create the STEP generation framework.

### Tasks

* add `cad/` folder structure
* add worker protocol
* add worker client
* add worker bootstrap
* add React hook
* add STEP button UI
* add placeholder STEP generation path

### Deliverable

A functioning UI-to-worker export pipeline.

---

## Phase 2 — Base Blind Flange Solid

### Objective

Generate the minimum valid flange body.

### Tasks

* implement geometry normalization from calculator result
* implement base solid creation
* implement bolt hole coordinate generation
* implement bolt hole subtraction
* export STEP

### Deliverable

A downloadable STEP containing blind flange disk + through holes.

---

## Phase 3 — Geometry Modes

### Objective

Support both standard and custom design paths cleanly.

### Tasks

* normalize standard result to CAD geometry
* normalize custom result to CAD geometry
* normalize manual design overrides to CAD geometry
* add validation for missing custom geometry fields

### Deliverable

Both standard and custom configurations generate valid STEP files.

---

## Phase 4 — Facing Features

### Objective

Add flange face detail features.

### Tasks

* add facing type mapping
* support flat face
* support raised face
* prepare RTJ/groove extension point
* update validation and export naming

### Deliverable

More realistic flange face geometry in STEP export.

---

## Phase 5 — Quality and Verification

### Objective

Make exported model trustworthy and predictable.

### Tasks

* compare STEP dimensions against calculator output
* verify bolt pattern angular spacing
* verify outer diameter and thickness values
* verify no overlap/cut-through invalidity
* test across multiple DN/PN combinations and custom geometry cases

### Deliverable

Stable export quality across representative configurations.

---

## 17. Testing Requirements

## 17.1 Unit Tests

Test pure functions for:

* geometry normalization
* bolt hole coordinate generation
* validation logic
* facing feature parameter derivation

## 17.2 Integration Tests

Test:

* button click triggers worker call
* progress updates are shown
* STEP buffer is returned
* error path displays readable message

## 17.3 Geometry Verification Cases

Minimum set:

* standard DN 100 configuration
* custom OD with inherited bolt circle
* large bolt count case
* hole-edge clearance boundary case
* invalid hole diameter case
* invalid bolt circle case

---

## 18. Acceptance Criteria

## 18.1 Functional

* user can export a `.step` file from `BlindFlangeCalculator`
* exported model matches current configured flange geometry
* standard mode works
* custom mode works
* hole count, hole size, and bolt circle are correct

## 18.2 Technical

* CAD generation does not run in the main thread
* React page remains responsive
* CAD code is isolated in dedicated files
* export action is integrated cleanly into existing export UI
* no CAD logic is embedded directly in `index.tsx`

## 18.3 Quality

* invalid geometry is rejected with readable errors
* output is dimensionally consistent with calculator values
* architecture is extensible for future face/groove features

---

## 19. Risks and Mitigation

## 19.1 Risk: Mixing calculation objects and CAD objects

The current tool has rich calculation/report structures. Using them directly for CAD would make the code fragile.

### Mitigation

Introduce a dedicated `BlindFlangeCadGeometry` normalization step.

## 19.2 Risk: Wrong export source in custom mode

The current tool can derive standard, custom, and user-defined configurations. Export could accidentally use the wrong geometry source if priority is not defined.

### Mitigation

Enforce explicit source priority:

1. user design config
2. custom result
3. standard result

## 19.3 Risk: Bolt holes breaking outside flange edge

Large hole diameters or incorrect bolt circle can produce invalid solids.

### Mitigation

Add pre-build geometric validation.

## 19.4 Risk: Overloading existing export utilities

The current module already includes export/report helpers. Adding STEP into those generic utilities may create unnecessary coupling.

### Mitigation

Keep STEP generation in a dedicated `cad/` subsystem and only expose a thin UI trigger through `ExportActions` or a sibling panel.

---

## 20. Definition of Done

This task is complete when:

* `BlindFlangeCalculator` has a dedicated CAD export subsystem
* the UI provides a working `Download .STEP (3D)` action
* a valid blind flange solid can be exported for supported configurations
* the implementation supports both standard and custom geometry paths
* the code structure is ready for future raised-face / groove extensions

---

## 21. Recommended First PR Scope

The first implementation PR should contain only:

* folder structure
* CAD types
* worker protocol
* worker client
* React hook
* export button
* placeholder solid export

Then the second PR should implement:

* actual blind flange solid
* bolt hole pattern
* validation
* final STEP export

This will reduce integration risk and make review easier.

```

A few implementation notes based on the current codebase:

- The tool already treats blind flange sizing as a **preliminary calculation workflow** with PN selection, thickness, bolt data, and weight estimate, so the 3D export should be positioned as a geometry export of the configured result, not as a certified design output. :contentReference[oaicite:7]{index=7}
- `index.tsx` already maintains the right high-level state for export source selection: standard result, custom result, and `designConfig`. That makes it the correct place to **choose which geometry object is exported**, but not the place to build CAD geometry directly. :contentReference[oaicite:8]{index=8}
- The current folder composition strongly suggests keeping STEP generation separate from `utils.ts`, `download.ts`, and `exportUtils.ts`, because those files already serve calculation/export/report concerns and would become overloaded if used as the main CAD layer. :contentReference[oaicite:9]{index=9}

```

[1]: https://github.com/biosxxx/cadautoscript.com/tree/main/src/components/tools/BlindFlangeCalculator "cadautoscript.com/src/components/tools/BlindFlangeCalculator at main · biosxxx/cadautoscript.com · GitHub"
[2]: https://github.com/biosxxx/cadautoscript.com/raw/refs/heads/main/src/components/tools/BlindFlangeCalculator/index.tsx "raw.githubusercontent.com"
