# Technical Specification

## 3D STEP Head Generation for `VesselHeadCalculator`

## 1. Purpose

This document defines the technical requirements, architecture, implementation plan, and acceptance criteria for adding **3D STEP model generation of vessel heads** to the `VesselHeadCalculator` tool.

The new functionality must follow the **same technology direction and architectural approach** already used in `TubeSheetGenerator`, while adapting the geometry pipeline to the different nature of head geometry.

---

## 2. Background

The application already contains a working STEP generation implementation in `TubeSheetGenerator`, and that module is structured with clear separation between UI, hooks, services, and core logic. `VesselHeadCalculator` already contains calculation and visualization logic, but does not yet contain a dedicated 3D CAD generation/export pipeline. ([GitHub][1])

The objective is to extend `VesselHeadCalculator` so users can generate a **3D STEP file of vessel heads** based on the entered parameters, with an implementation that is maintainable, scalable, and consistent with the existing project architecture.

---

## 3. Goal

Implement a new 3D export subsystem for `VesselHeadCalculator` that:

* generates a valid **3D STEP file**
* uses the **same core CAD technology stack and worker-based approach** as the existing generator
* supports head geometry derived from the calculator input parameters
* is designed to be extensible for future features such as nozzles, edge preparation, and additional export formats

---

## 4. Scope

### In Scope

* STEP generation for vessel heads from calculator input
* worker-based CAD generation pipeline
* reusable geometry/domain layer
* export UI integration
* validation for CAD generation
* progress and error handling
* architecture prepared for future nozzle support

### Out of Scope for MVP

* advanced nozzle placement
* multiple export formats beyond STEP
* mesh preview / STL export
* manufacturing nesting
* FEA/CAE export
* server-side geometry generation

---

## 5. High-Level Design Principles

1. **Reuse architecture, not geometry**

   * Reuse the same CAD execution pattern as `TubeSheetGenerator`
   * Do not reuse its actual solid-building logic, because the geometry problem is different

2. **Separate calculation from CAD generation**

   * existing calculator formulas and 2D visualizer logic must not become the direct source of CAD operations
   * CAD should use its own derived geometry model

3. **Use axisymmetric modeling**

   * vessel heads should be generated from a **2D meridional profile** and then revolved into 3D
   * this is the correct geometric approach for dished heads

4. **Keep UI independent from CAD kernel**

   * React components must not directly handle CAD construction
   * CAD operations must run in a worker

5. **Design for incremental growth**

   * first implement base head generation
   * then add edge preparation
   * then add nozzles and optional details

---

## 6. Recommended Target Architecture

## 6.1 New Folder Structure

Recommended structure inside `src/components/tools/VesselHeadCalculator`:

```text
VesselHeadCalculator/
  components/
    ConfigPanel.tsx
    HeadVisualizer.tsx
    StepExportPanel.tsx
    PrintReport.tsx
    NozzleManager.tsx

  cad/
    geometry/
      compute-head-geometry.ts
      build-head-profile.ts
      build-head-solid.ts
      apply-edge-prep.ts
      add-nozzles.ts
      validation.ts
    hooks/
      useVesselHeadCad.ts
    services/
      cad-worker-protocol.ts
      cad-worker-client.ts
      cad-worker.ts
    types/
      cad-types.ts

  constants.ts
  index.tsx
  store.ts
  styles.module.css
  types.ts
  utils.ts
```

## 6.2 Responsibility by Layer

### UI Layer

Responsible for:

* collecting user input
* showing export button
* showing progress and errors
* triggering export

### Store / State Layer

Responsible for:

* current calculator configuration
* selected standard
* nozzle list
* export-related state if needed

### Domain Geometry Layer

Responsible for:

* translating user parameters into CAD-safe geometry data
* building 2D axis profile
* deriving transition points, radii, heights, tangency points

### CAD Service Layer

Responsible for:

* worker communication
* progress reporting
* worker initialization
* returning STEP blob/array buffer

### CAD Worker Layer

Responsible for:

* initializing CAD kernel
* building 3D solid
* exporting STEP
* isolating heavy CAD operations from UI

---

## 7. Functional Requirements

## 7.1 Main Feature

The user shall be able to generate and download a **3D STEP file** representing the vessel head defined by the current calculator parameters.

## 7.2 Supported Inputs for MVP

The generator shall support at minimum:

* standard / head type
* outside diameter
* thickness
* straight flange height
* crown geometry parameters derived from standard
* knuckle geometry parameters derived from standard
* edge preparation settings
* root face
* bevel angle

## 7.3 Output

The system shall produce:

* one valid `.step` file
* correct solid geometry for the selected head configuration
* user-readable error message if the geometry is invalid

## 7.4 UI Behavior

The UI shall provide:

* a button such as `Download .STEP (3D)`
* disabled state during generation
* progress feedback for:

  * CAD initialization
  * geometry generation
  * STEP export
* visible error state if generation fails

---

## 8. Non-Functional Requirements

### Performance

* generation must run in a **Web Worker**
* UI must remain responsive during export
* initialization of CAD kernel should be reusable across requests

### Maintainability

* CAD logic must be isolated from React components
* geometry code must be testable as pure functions where possible
* file structure must allow future support for nozzles and other export formats

### Reliability

* invalid geometry must fail gracefully
* no silent STEP corruption
* worker communication must support typed request/response protocol

### Extensibility

* architecture must allow adding:

  * nozzles
  * center openings
  * additional edge prep types
  * STL/DXF export
  * 3D preview

---

## 9. Geometry Modeling Strategy

## 9.1 Required Modeling Approach

The vessel head shall be modeled as an **axisymmetric solid** using the following pipeline:

1. calculate derived head dimensions
2. build the outer 2D profile
3. build the inner 2D profile based on thickness
4. close the cross-sectional contour
5. revolve the contour around the main axis
6. optionally apply edge preparation
7. optionally add nozzles in later phases
8. export STEP

## 9.2 Why This Approach Is Required

Unlike a tube sheet, which can be modeled as a plate with repeated cuts, a vessel head is best represented as a **revolved shell/solid**. A revolve-based approach is more robust, closer to manufacturing geometry, and easier to extend for flange, bevel, and nozzle logic.

## 9.3 Important Constraint

The existing calculator formulas must not be assumed to be sufficient for direct CAD generation.
A CAD-specific derived geometry model is required, including:

* crown radius
* knuckle radius
* tangent points
* transition points
* inner contour
* outer contour
* edge-prep contour modifications

---

## 10. Recommended Data Model

## 10.1 Existing Business Config

Existing calculator configuration should remain the primary source of user input.

## 10.2 New CAD-Specific Types

```ts
export type HeadCadConfig = HeadConfig & {
  includeEdgePrep?: boolean;
  includeNozzles?: boolean;
};

export type Point2D = {
  x: number;
  z: number;
};

export type AxisSegment =
  | { kind: 'line'; from: Point2D; to: Point2D }
  | {
      kind: 'arc';
      center: Point2D;
      radius: number;
      start: Point2D;
      end: Point2D;
    };

export type AxisProfile = {
  outerSegments: AxisSegment[];
  innerSegments: AxisSegment[];
  closedSegments: AxisSegment[];
};

export type HeadDerivedGeometry = {
  outsideDiameter: number;
  thickness: number;
  straightFlange: number;
  crownRadiusOuter: number;
  crownRadiusInner: number;
  knuckleRadiusOuter: number;
  knuckleRadiusInner: number;
  dishHeight: number;
  totalHeight: number;
  tangentPointOuter: Point2D;
  tangentPointInner: Point2D;
};
```

---

## 11. Worker Protocol Requirements

A dedicated typed protocol shall be introduced for communication between UI and the CAD worker.

## 11.1 Requests

```ts
export type WarmupRequest = {
  type: 'warmup';
  requestId: string;
};

export type GenerateStepRequest = {
  type: 'generate-step';
  requestId: string;
  config: HeadCadConfig;
  nozzles: Nozzle[];
};
```

## 11.2 Responses

```ts
export type ProgressResponse = {
  type: 'progress';
  requestId: string;
  stage: 'init' | 'geometry' | 'export';
  done: number;
  total: number;
};

export type SuccessResponse = {
  type: 'result';
  requestId: string;
  ok: true;
  payload: {
    step: ArrayBuffer;
  };
};

export type ErrorResponse = {
  type: 'result';
  requestId: string;
  ok: false;
  payload: {
    message: string;
    stack?: string;
  };
};
```

---

## 12. Required New Modules

## 12.1 `cad/services/cad-worker-protocol.ts`

Defines all worker request/response types.

## 12.2 `cad/services/cad-worker-client.ts`

Responsibilities:

* create singleton worker
* manage pending requests
* map request IDs to callbacks/promises
* expose:

  * `warmupCadWorker()`
  * `generateStepInWorker(...)`

## 12.3 `cad/services/cad-worker.ts`

Responsibilities:

* initialize CAD kernel
* listen to worker messages
* call geometry builder
* export STEP
* return `ArrayBuffer`

## 12.4 `cad/hooks/useVesselHeadCad.ts`

Responsibilities:

* expose worker status
* expose warmup action
* expose STEP generation action
* isolate CAD integration from React UI

## 12.5 `cad/geometry/compute-head-geometry.ts`

Responsibilities:

* derive CAD-safe geometry values from calculator config
* calculate exact profile-driving dimensions

## 12.6 `cad/geometry/build-head-profile.ts`

Responsibilities:

* build outer and inner axis profile
* guarantee valid contour ordering
* produce closed profile

## 12.7 `cad/geometry/build-head-solid.ts`

Responsibilities:

* convert profile into 3D solid
* revolve profile around axis
* return CAD solid/body

## 12.8 `cad/geometry/apply-edge-prep.ts`

Responsibilities:

* modify edge contour before solid generation
* support single bevel, double bevel, root face where applicable

## 12.9 `cad/geometry/add-nozzles.ts`

Responsibilities:

* placeholder for phase 2+
* add nozzle cuts and nozzle solids

## 12.10 `cad/geometry/validation.ts`

Responsibilities:

* validate dimensions before worker execution
* catch impossible CAD combinations early

## 12.11 `components/StepExportPanel.tsx`

Responsibilities:

* export button
* progress display
* generation state
* error display

---

## 13. UI Requirements

## 13.1 New Export Panel

A new panel or button area shall be added to `VesselHeadCalculator` UI.

### Minimum features

* `Download .STEP (3D)` button
* loading status
* generation progress text
* disabled state while running
* visible message on failure

### Suggested statuses

* `Initializing CAD kernel...`
* `Building head geometry...`
* `Exporting STEP...`
* `Done`

## 13.2 Error Handling

The UI must display meaningful messages for:

* invalid thickness
* impossible bevel/root-face combination
* invalid derived profile
* worker initialization failure
* STEP export failure

---

## 14. Validation Rules

At minimum, validation shall include:

* outside diameter > 0
* thickness > 0
* straight flange >= 0
* thickness less than allowable geometric limit
* root face < thickness
* bevel angle within allowed range
* derived inner geometry must not self-intersect
* revolved contour must remain valid and closed

Optional future validation:

* nozzle-to-nozzle collision
* nozzle outside allowed zones
* minimum crown distance
* standard-specific dimensional limits

---

## 15. Implementation Phases

## Phase 1 — CAD Infrastructure

### Objective

Create the worker-based export infrastructure.

### Tasks

* add `cad/` directory
* implement worker protocol
* implement worker client
* implement worker warmup
* add React hook for CAD
* add export panel UI
* connect export button to worker pipeline

### Deliverable

A working export pipeline that can initialize CAD worker and return a placeholder/simple STEP.

---

## Phase 2 — Base Head Geometry

### Objective

Generate a valid 3D head without nozzles.

### Tasks

* implement derived geometry calculator
* implement outer profile builder
* implement inner profile builder
* implement closed contour generator
* implement revolve-based solid creation
* export final STEP file

### Deliverable

A valid STEP for the base head using current calculator inputs.

---

## Phase 3 — Edge Preparation

### Objective

Add bevel/root-face support.

### Tasks

* implement edge prep contour modification
* support selected edge preparation settings
* validate invalid edge-prep combinations
* ensure export remains stable

### Deliverable

A valid STEP with optional edge preparation geometry.

---

## Phase 4 — Nozzle Support

### Objective

Add optional nozzle openings and nozzle bodies.

### Tasks

* extend nozzle data model
* compute local placement on head surface
* cut nozzle openings
* optionally fuse nozzle necks
* validate position constraints

### Deliverable

A STEP file with optional nozzle geometry.

---

## Phase 5 — Geometry/Preview Alignment

### Objective

Reduce mismatch between 2D visualization and 3D CAD.

### Tasks

* move shared geometric derivations into common domain functions
* adapt visualizer to use the same derived geometry model
* verify dimensional consistency between SVG and STEP

### Deliverable

2D preview and 3D export driven by the same core geometry.

---

## 16. Recommended Implementation Order

1. create CAD folder structure
2. implement worker protocol and client
3. add export button and hook
4. implement placeholder worker export
5. implement derived geometry calculator
6. implement profile builder
7. implement revolve solid generation
8. add validation
9. add edge prep
10. add nozzle support

---

## 17. Acceptance Criteria

## 17.1 Functional Acceptance

* user can click `Download .STEP (3D)`
* the application generates a STEP file for valid input
* the exported shape matches expected head dimensions
* UI remains responsive during generation
* invalid configurations produce readable errors

## 17.2 Technical Acceptance

* CAD logic is not embedded inside React components
* worker communication uses typed protocol
* geometry generation is separated into dedicated files
* base implementation is extensible for nozzles and edge prep
* no blocking CAD work runs on the main thread

## 17.3 Quality Acceptance

* code structure matches project conventions
* no duplicated geometry logic between unrelated layers
* clear naming and file separation
* future features can be added without rewriting the export pipeline

---

## 18. Risks and Technical Notes

## 18.1 Main Risk

The biggest technical risk is attempting to build STEP geometry directly from current calculator formulas and 2D visualizer assumptions. Those are suitable for UI calculations, but not always sufficient for robust CAD solids.

## 18.2 Secondary Risks

* invalid inner contour from naive thickness offset
* self-intersections near knuckle/crown transitions
* unstable bevel geometry
* worker initialization problems
* mismatch between displayed and exported geometry

## 18.3 Mitigation

* create dedicated CAD-derived geometry model
* validate contour before revolve
* implement feature set incrementally
* keep nozzle logic out of MVP base solid

---

## 19. Suggested Public API

```ts
export async function warmupCadWorker(): Promise<void>;

export async function generateStepInWorker(
  config: HeadCadConfig,
  nozzles: Nozzle[],
  options?: {
    onProgress?: (msg: ProgressResponse) => void;
  }
): Promise<ArrayBuffer>;

export function computeHeadDerivedGeometry(
  config: HeadCadConfig
): HeadDerivedGeometry;

export function buildHeadProfile(
  config: HeadCadConfig
): AxisProfile;

export function buildHeadSolid(
  config: HeadCadConfig
): unknown;
```

---

## 20. Definition of Done

This task is complete when:

* `VesselHeadCalculator` includes a dedicated CAD export subsystem
* a user can generate a valid 3D STEP file for supported head configurations
* the implementation follows the worker-based pattern used by the existing generator
* the codebase has clean separation between UI, domain geometry, and CAD services
* the solution is ready for future extension with nozzle support

---

## 21. Recommended Next Step for Development

Start with a **scaffold PR** that introduces only:

* folder structure
* worker protocol
* worker client
* CAD hook
* export panel
* placeholder STEP generation path


[1]: https://github.com/biosxxx/cadautoscript.com/tree/main/src/components/tools/TubeSheetGenerator "cadautoscript.com/src/components/tools/TubeSheetGenerator at main · biosxxx/cadautoscript.com · GitHub"
