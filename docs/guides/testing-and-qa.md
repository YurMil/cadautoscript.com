---
title: Testing and QA strategy
description: How CAD AutoScript utilities are verified — unit tests for calculation engines, published validation cases, manual checklists for file-based tools, and platform support expectations.
slug: /guides/testing-and-qa
keywords:
  - testing
  - quality assurance
  - validation
  - engineering calculation verification
---

# Testing and QA strategy

These tools produce numbers people cut steel to. This page describes how those
numbers are verified — both so contributors know what is expected before
publishing a utility, and so users can judge how much trust a given result has
earned.

## The principle

**A calculation engine is guarded by tests whose fixtures are also the published
evidence.** The same reference cases that fail the build when an engine
regresses appear on the tool's documentation page as validation cases, with the
hand calculation spelled out. One set of numbers, two jobs — so the public claim
can never drift from what the code actually does.

See the validation cases on the
[Blind Flange Calculator](/docs/utilities/blind-flange-calculator) and
[Dished End Calculator](/docs/utilities/pressure-vessel-dished-end-calc) pages
for what this looks like in practice.

## Layers of verification

### 1. Unit tests — calculation engines

Every tool with a normative basis (EN, DIN, ASME, ISO) should have unit tests
covering:

- **Reference cases per standard**, computed by hand from the standard's own
  relations, not from the code's output. A test written by running the code and
  pasting the result proves only that the code is deterministic.
- **Boundary conditions** — the exact values where behaviour changes
  (`thickness ≥ Da/2`, the PN class step from 40 to 63, a size band edge in a
  tolerance table).
- **Invalid input** — what the engine does with zero, negative, non-numeric and
  out-of-range values. Failing loudly is a valid answer; failing silently is not.

Tests run with [Vitest](https://vitest.dev/) in every app repository.

### 2. Type checking — cross-cutting contracts

`pnpm typecheck` is a correctness gate, not a formality. Two contracts are
enforced entirely through types:

- **Locale completeness.** Every locale dictionary is typed against `en`, so a
  string missing from any of the six languages fails the build.
- **Share-link parameter coverage.** The share protocol's applier map is keyed
  by `keyof ShellParameters`, so adding an input parameter without wiring it into
  the protocol does not compile.

### 3. Build — link and asset integrity

The site build runs with `DOCUSAURUS_ONBROKENLINKS=throw` in CI, so a broken
internal link fails the build rather than shipping a dead page.

### 4. Manual checklists — file-based tools

File I/O is where automated coverage is weakest and real-world input is most
hostile. Before releasing a change to a file-handling tool, walk its checklist.

#### PDF tools

| Case | Expected |
|---|---|
| Valid PDF | opens, all pages render |
| **Renamed non-PDF** (`.docx` saved as `.pdf`) | rejected by signature check, clear message |
| **Password-protected PDF** | reported as *encrypted*, not as corrupt |
| Truncated / corrupt file | clear error, app stays usable |
| Zero-byte file | rejected before parsing |
| Very large file (>200 MB) | rejected with the size limit stated |
| Multi-file batch with one bad file | the bad one is named; the rest still process |

The encrypted case is worth its own line: pdf.js throws `PasswordException` with
the message *"No password given"*, which contains neither "encrypted" nor
"password-protected". Matching on the message alone silently misreports every
locked file as damaged.

#### DXF exports

| Case | Expected |
|---|---|
| Open in **eDrawings / AutoCAD viewer** | opens without an error dialog |
| Open in a permissive viewer (LibreCAD, online) | same geometry |
| Layers | present and named as documented |
| Units | interpreted as millimetres |
| Geometry closure | contours close; no gaps at seams |

Strict viewers validate what the header claims. A file declaring a modern
version (`AC1015`+) must actually carry the sections that version requires —
declaring R12 (`AC1009`) and emitting a minimal file is valid; declaring
AC1015 and emitting the same minimal file is not, and is rejected.

#### STEP exports

| Case | Expected |
|---|---|
| Import into a CAD system | solid body, not a surface soup |
| Geometry | matches the on-screen preview dimensions |
| Repeated export | deterministic output for identical input |

### 5. Cross-checks between tools

Where two tools compute related quantities, compare them. A dished end's blank
diameter and a rolled shell's developed length both depend on how the neutral
axis is treated; a disagreement between them is a bug in one of the two.

## Platform expectations

Utilities target **current Chromium-based browsers**, and assume:

- **WebGL 2** for 3D tools (STEP viewer, pipe cutter, QR nameplate, games)
- **WebAssembly** for CAD kernels (OpenCascade) and PDF parsing
- **Web Workers** for anything long-running, so the UI thread stays responsive

Firefox and Safari generally work, but are not the verification target. Where a
capability may be missing, **feature-detect and degrade rather than fail**: the
PDF signature check skips itself when `Blob.arrayBuffer` is unavailable rather
than rejecting every file, because it is defence in depth, not a security
boundary.

Everything runs client-side. No file a user opens is uploaded anywhere — which
is a correctness property worth preserving deliberately, not only a privacy one.

## Before publishing a utility

1. Unit tests for the calculation engine, with at least two reference cases per
   supported standard.
2. Those fixtures published as validation cases on the docs page.
3. CI that runs typecheck, tests and build on every pull request.
4. **Tests wired into the deploy path**, not just the PR path — a workflow that
   builds and publishes without running tests cannot stop a broken release.
5. The relevant manual checklist walked once by hand.

See also:
[where utility code lives](https://github.com/YurMil/cadautoscript.com/blob/main/dev-plans/utility-development-workflow.md)
for the repository structure these checks run in.

## Current coverage

Stated plainly, because a strategy page that only describes the intent is not
much use:

| Utility | Engine tests | Tests gate deploy |
|---|---|---|
| Blind Flange Calculator | 71 | ✅ |
| Tube Sheet Generator | 63 | ✅ |
| Dished End Calculator | 32 | ✅ |
| Pipe Notch Generator | 31 | ❌ tests exist, deploy does not run them |
| PDF Master | 22 | ❌ tests exist, deploy does not run them |
| Cylindrical Shell Rolling | — | — |
| WebSTEP Viewer | — | — |
| PDF BOM Extractor | — | — |
| 3D QR Nameplate | — | — |

The gaps that matter most: **Shell Rolling has a normative calculation engine
and no tests at all**, and **53 existing tests do not block a bad deploy**
because their publish workflows skip them. Both are cheap to close and worth
doing before adding coverage anywhere else.
