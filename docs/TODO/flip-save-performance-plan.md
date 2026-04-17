---
name: Flip Save Performance Plan
overview: Reduce flip/save latency by removing avoidable client-side recomputation and cutting autosave network/DB fan-out, while keeping behavior stable through phased, low-risk changes.
todos:
  - id: add-baseline-instrumentation
    content: Add timing and count instrumentation for flip and autosave client/server paths
    status: pending
  - id: remove-unnecessary-sorts
    content: Make transform/flip updates skip model reorder work unless z-index changes
    status: pending
  - id: non-mutating-save-serialization
    content: Refactor save serialization to avoid global z-index rewrites each save
    status: pending
  - id: dirty-only-autosave
    content: Track persisted snapshots and patch only changed images/viewport
    status: pending
  - id: batch-layout-patch-endpoint
    content: Implement and adopt batch image layout patch API to reduce request fan-out
    status: pending
  - id: server-query-optimization
    content: Reduce redundant DB round-trips while preserving API semantics
    status: pending
  - id: bridge-notify-coalescing
    content: Coalesce bridge/store notifications if interaction path still shows UI overhead
    status: pending
  - id: benchmark-and-verify
    content: Run targeted regression and performance benchmarks before/after each phase
    status: pending
---

# Step-by-Step Performance Improvement Plan

## Goals

- Make flip interactions feel instant (target <50ms UI path).
- Reduce save latency from collection-size-dependent fan-out to changed-items-only updates.
- Preserve existing UX semantics (`saving/saved/error`, undo/redo behavior).

## Phase 0: Measure Before Changing

- Add lightweight timing around `flipSelectedImageX`, `layoutRowsForSave`, and autosave request count in [`/Users/aliapkinaleksei/shadowcrypt/lib/board/Board.ts`](/Users/aliapkinaleksei/shadowcrypt/lib/board/Board.ts) and [`/Users/aliapkinaleksei/shadowcrypt/lib/board/CollectionAutosave.ts`](/Users/aliapkinaleksei/shadowcrypt/lib/board/CollectionAutosave.ts).
- Add server timing spans in [`/Users/aliapkinaleksei/shadowcrypt/server/api/collections/[id]/images/[imageId].patch.ts`](/Users/aliapkinaleksei/shadowcrypt/server/api/collections/[id]/images/[imageId].patch.ts).
- Record: image count, changed image count, request count, client prep time, server per-request time.

## Phase 1: Remove Flip-Path CPU Waste (Quick Win)

- In [`/Users/aliapkinaleksei/shadowcrypt/lib/board/Board.ts`](/Users/aliapkinaleksei/shadowcrypt/lib/board/Board.ts), stop sorting model images when only transform fields change.
- Ensure `syncModelImage` only triggers `sortImagesByZIndex()` when z-index changed.
- Keep z-index ordering updates in dedicated reorder paths (`touchImage`, explicit z-index changes).

## Phase 2: Stop Save-Time Global Rewrites

- Refactor `layoutRowsForSave()` in [`/Users/aliapkinaleksei/shadowcrypt/lib/board/Board.ts`](/Users/aliapkinaleksei/shadowcrypt/lib/board/Board.ts) to be non-mutating.
- Replace `normalizeImageZIndices()` in save serialization with a read-only sorted snapshot.
- Normalize z-indexes only when actually needed (duplicate/gap detected), not every save cycle.

## Phase 3: Dirty-Only Autosave (Highest Impact)

- In [`/Users/aliapkinaleksei/shadowcrypt/lib/board/CollectionAutosave.ts`](/Users/aliapkinaleksei/shadowcrypt/lib/board/CollectionAutosave.ts), track last persisted layout+flip+z per image.
- Send PATCH only for changed images (`K`), not all images (`N`).
- Apply same diff rule for viewport updates.
- On successful persist, refresh local persisted snapshot cache.

## Phase 4: Reduce Request Chattiness

- Add batch endpoint in server API (e.g. `PATCH /api/collections/:id/images`) with one auth check + one collection validation + transactional multi-row updates.
- Keep existing per-image endpoint for compatibility.
- Switch autosave client to batch endpoint after parity testing.

## Phase 5: Server Query Tightening

- For per-image patch (and/or inside batch), remove redundant select-before-update when safe; rely on guarded `UPDATE ... WHERE ...` and affected-row checks.
- Preserve current error semantics (404 vs forbidden) in API responses.

## Phase 6: Bridge/UI Notification Coalescing

- In [`/Users/aliapkinaleksei/shadowcrypt/lib/board/BoardVueBridge.ts`](/Users/aliapkinaleksei/shadowcrypt/lib/board/BoardVueBridge.ts), coalesce notifications around flip/save state transitions.
- In [`/Users/aliapkinaleksei/shadowcrypt/app/composables/useBoard.ts`](/Users/aliapkinaleksei/shadowcrypt/app/composables/useBoard.ts) and [`/Users/aliapkinaleksei/shadowcrypt/app/stores/useCollectionViewerStore.ts`](/Users/aliapkinaleksei/shadowcrypt/app/stores/useCollectionViewerStore.ts), avoid full state copying on no-op updates.

## Validation Strategy

- Regression checks:
  - Flip state persists across reload.
  - Undo/redo stack behavior unchanged.
  - Save indicator transitions unchanged.
- Performance checks:
  - Single flip in large collection: measure UI path + autosave prep.
  - Compare request count before/after (expect `N -> K` for typical edits).
  - Compare median save completion time across 10/100/500 image collections.

## Rollout Order

- PR1: Phase 1 + Phase 2 (local CPU fixes).
- PR2: Phase 3 (dirty-only autosave).
- PR3: Phase 4 + Phase 5 (batch server path).
- PR4: Phase 6 (notification tuning, if still needed).
