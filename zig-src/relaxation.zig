const std = @import("std");

/// Maximum number of rectangles that can be laid out.
pub const max_rects: usize = 512;
/// Maximum number of relaxation iterations per solve.
/// This is the actual solve budget for one `solve()` call.
/// `max_rects` only limits input size; it does not increase iteration count.
/// If one run still has visible motion or overlap cleanup left near the end, raise this.
/// If later iterations are already stalling into a force balance, increasing this alone
/// usually does much less than expected.
const max_iterations: usize = 1024;
/// Lower bound for broad-phase grid cell size in world units.
const grid_cell_size_min: f32 = 128.0;
/// Upper bound for broad-phase grid cell size in world units.
const grid_cell_size_max: f32 = 512.0;
/// Fraction of penetration resolved per overlap pair each iteration.
/// Higher values clear overlaps faster, but can also make the layout kick harder
/// and overshoot before damping settles it back down.
const separation_strength: f32 = 1.0;
/// Weak pull back toward each rectangle's original position.
/// Small but non-zero so layouts do not drift arbitrarily far from the starting composition.
/// If rerunning the solver works much better than adding more iterations, this is
/// one of the first constants to question. A rerun effectively redefines the
/// "original" positions to the latest layout, while one long run keeps pulling
/// toward the older starting arrangement.
const anchor_strength: f32 = 0.0005;
/// Very weak pull toward the overall layout center.
/// Kept weaker than the anchor so compactness does not dominate arrangement preservation.
/// This prevents the pack from spreading forever, but too much compactness can
/// keep dense groups compressed and preserve tiny residual overlaps.
const compactness_strength: f32 = 0.0025;
/// Velocity damping used to suppress oscillation.
/// Higher values keep velocity around longer and feel smoother, but can also make
/// the solver sluggish to settle tiny collisions. Lower values react harder per
/// step, but increase the risk of bounce and churn.
const damping: f32 = 0.99;
/// Maximum movement length for one rectangle in a single iteration.
/// This caps explosive jumps. Too low makes large overlaps take many passes to
/// open up. Too high can cause overshoot and noisy settling.
const max_step: f32 = 96.0;
/// Desired empty space between solved rectangles, modeled as collision inflation.
pub const target_gap: f32 = 8.0;
/// Early-out threshold when movement becomes negligible.
/// Lower this if the solver is stopping while tiny corrections are still useful.
/// Raising it exits earlier, which is cheaper but makes small residual overlaps
/// more likely to survive.
const stop_epsilon: f32 = 0.05;

const grid_bucket_count: usize = 8192;
const grid_max_nodes: usize = max_rects * 32;

var grid_bucket_heads: [grid_bucket_count]i32 = undefined;
var grid_nodes: [grid_max_nodes]GridNode = undefined;
var candidate_seen_stamp: [max_rects]u32 = @splat(0);
var grid_cell_size_current: f32 = grid_cell_size_min;
var grid_cell_size_inv_current: f32 = 1.0 / grid_cell_size_min;

pub const SolveStats = struct {
    iterations: u32 = 0,
    pair_checks: u32 = 0,
    overlaps: u32 = 0,
    converged: bool = false,
    grid_nodes: u32 = 0,
    used_grid: bool = false,
    grid_cell_size: f32 = grid_cell_size_min,
};

const GridNode = struct {
    cell_x: i32,
    cell_y: i32,
    rect_index: u32,
    next: i32,
};

pub const Rect = struct {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
    original_x: f32,
    original_y: f32,
    velocity_x: f32 = 0,
    velocity_y: f32 = 0,
    displacement_x: f32 = 0,
    displacement_y: f32 = 0,

    pub fn centerX(self: Rect) f32 {
        return self.x + self.w * 0.5;
    }

    pub fn centerY(self: Rect) f32 {
        return self.y + self.h * 0.5;
    }

    pub fn inflatedHalfWidth(self: Rect) f32 {
        return self.w * 0.5 + target_gap * 0.5;
    }

    pub fn inflatedHalfHeight(self: Rect) f32 {
        return self.h * 0.5 + target_gap * 0.5;
    }

    fn originalCenterX(self: Rect) f32 {
        return self.original_x + self.w * 0.5;
    }

    fn originalCenterY(self: Rect) f32 {
        return self.original_y + self.h * 0.5;
    }
};

pub fn absf(value: f32) f32 {
    return @abs(value);
}

fn stableSign(primary: f32, fallback: f32) f32 {
    const eps: f32 = 0.0001;
    if (primary > eps) {
        return 1.0;
    }
    if (primary < -eps) {
        return -1.0;
    }
    if (fallback > eps) {
        return 1.0;
    }
    if (fallback < -eps) {
        return -1.0;
    }
    return 1.0;
}

fn clampVector(x: *f32, y: *f32, max_len: f32) void {
    const len_sq = x.* * x.* + y.* * y.*;
    if (len_sq == 0) {
        return;
    }
    const max_sq = max_len * max_len;
    if (len_sq <= max_sq) {
        return;
    }
    const scale = max_len / @sqrt(len_sq);
    x.* *= scale;
    y.* *= scale;
}

fn clampf(value: f32, min_value: f32, max_value: f32) f32 {
    return @min(@max(value, min_value), max_value);
}

fn chooseGridCellSize(rects: []const Rect) f32 {
    var total_extent: f32 = 0;
    for (rects) |rect| {
        total_extent += @max(rect.w, rect.h);
    }

    const inv_count = 1.0 / @as(f32, @floatFromInt(rects.len));
    const average_extent = total_extent * inv_count;
    // Bias upward so large rectangles occupy fewer cells and the grid stays useful
    // for layouts dominated by card-like blocks around 400x400 units.
    return clampf(average_extent * 1.25 + target_gap, grid_cell_size_min, grid_cell_size_max);
}

fn cellCoord(value: f32) i32 {
    return @as(i32, @intFromFloat(@floor(value * grid_cell_size_inv_current)));
}

fn hashCell(cell_x: i32, cell_y: i32) usize {
    const x: u32 = @bitCast(cell_x);
    const y: u32 = @bitCast(cell_y);
    const mixed = x *% 73856093 ^ y *% 19349663;
    return mixed % grid_bucket_count;
}

fn insertGridNode(node_count: *usize, rect_index: usize, cell_x: i32, cell_y: i32) bool {
    if (node_count.* >= grid_max_nodes) {
        return false;
    }
    const bucket = hashCell(cell_x, cell_y);
    grid_nodes[node_count.*] = .{
        .cell_x = cell_x,
        .cell_y = cell_y,
        .rect_index = @intCast(rect_index),
        .next = grid_bucket_heads[bucket],
    };
    grid_bucket_heads[bucket] = @intCast(node_count.*);
    node_count.* += 1;
    return true;
}

fn buildSpatialGrid(rects: []Rect, stats: *SolveStats) bool {
    @memset(&grid_bucket_heads, -1);
    var node_count: usize = 0;
    grid_cell_size_current = chooseGridCellSize(rects);
    grid_cell_size_inv_current = 1.0 / grid_cell_size_current;
    stats.grid_cell_size = grid_cell_size_current;

    for (rects, 0..) |rect, rect_index| {
        const min_x = rect.x - target_gap * 0.5;
        const min_y = rect.y - target_gap * 0.5;
        const max_x = rect.x + rect.w + target_gap * 0.5;
        const max_y = rect.y + rect.h + target_gap * 0.5;
        const cell_min_x = cellCoord(min_x);
        const cell_min_y = cellCoord(min_y);
        const cell_max_x = cellCoord(max_x);
        const cell_max_y = cellCoord(max_y);

        var cy = cell_min_y;
        while (cy <= cell_max_y) : (cy += 1) {
            var cx = cell_min_x;
            while (cx <= cell_max_x) : (cx += 1) {
                if (!insertGridNode(&node_count, rect_index, cx, cy)) {
                    return false;
                }
            }
        }
    }

    stats.grid_nodes = @intCast(node_count);
    stats.used_grid = true;
    return true;
}

fn resolveAllPairs(rects: []Rect, stats: *SolveStats) void {
    var i: usize = 0;
    while (i < rects.len) : (i += 1) {
        var j: usize = i + 1;
        while (j < rects.len) : (j += 1) {
            resolveOverlap(&rects[i], &rects[j], stats);
        }
    }
}

fn resolveSpatialPairs(rects: []Rect, stats: *SolveStats) void {
    // Candidate dedupe is only valid inside one broad-phase pass.
    // Reset on entry so marks from previous iterations cannot suppress valid pairs.
    @memset(&candidate_seen_stamp, 0);
    var query_stamp: u32 = 0;

    for (rects, 0..) |rect, rect_index| {
        query_stamp +%= 1;
        if (query_stamp == 0) {
            @memset(&candidate_seen_stamp, 0);
            query_stamp = 1;
        }

        const min_x = rect.x - target_gap * 0.5;
        const min_y = rect.y - target_gap * 0.5;
        const max_x = rect.x + rect.w + target_gap * 0.5;
        const max_y = rect.y + rect.h + target_gap * 0.5;
        const cell_min_x = cellCoord(min_x);
        const cell_min_y = cellCoord(min_y);
        const cell_max_x = cellCoord(max_x);
        const cell_max_y = cellCoord(max_y);

        var cy = cell_min_y;
        while (cy <= cell_max_y) : (cy += 1) {
            var cx = cell_min_x;
            while (cx <= cell_max_x) : (cx += 1) {
                const bucket = hashCell(cx, cy);
                var node_index = grid_bucket_heads[bucket];
                while (node_index >= 0) {
                    const node = grid_nodes[@intCast(node_index)];
                    if (node.cell_x == cx and node.cell_y == cy) {
                        const candidate_index: usize = node.rect_index;
                        if (candidate_index > rect_index and candidate_seen_stamp[candidate_index] != query_stamp) {
                            candidate_seen_stamp[candidate_index] = query_stamp;
                            resolveOverlap(&rects[rect_index], &rects[candidate_index], stats);
                        }
                    }
                    node_index = node.next;
                }
            }
        }
    }
}

fn resolveOverlap(a: *Rect, b: *Rect, stats: *SolveStats) void {
    stats.pair_checks += 1;
    const delta_x = b.centerX() - a.centerX();
    const delta_y = b.centerY() - a.centerY();
    const overlap_x = a.inflatedHalfWidth() + b.inflatedHalfWidth() - absf(delta_x);
    const overlap_y = a.inflatedHalfHeight() + b.inflatedHalfHeight() - absf(delta_y);

    if (overlap_x <= 0 or overlap_y <= 0) {
        return;
    }

    stats.overlaps += 1;

    if (overlap_x < overlap_y) {
        const dir = stableSign(delta_x, b.originalCenterX() - a.originalCenterX());
        const push = overlap_x * separation_strength * 0.5;
        a.displacement_x -= dir * push;
        b.displacement_x += dir * push;
        return;
    }

    const dir = stableSign(delta_y, b.originalCenterY() - a.originalCenterY());
    const push = overlap_y * separation_strength * 0.5;
    a.displacement_y -= dir * push;
    b.displacement_y += dir * push;
}

/// Pushes overlapping rects apart in place. Each rect's `original_x/y` is the anchor target.
pub fn solve(rects: []Rect) SolveStats {
    var stats = SolveStats{};
    if (rects.len == 0) {
        stats.converged = true;
        return stats;
    }

    var iteration: usize = 0;
    while (iteration < max_iterations) : (iteration += 1) {
        stats.iterations += 1;
        for (rects) |*rect| {
            rect.displacement_x = 0;
            rect.displacement_y = 0;
        }

        if (buildSpatialGrid(rects, &stats)) {
            resolveSpatialPairs(rects, &stats);
        } else {
            stats.used_grid = false;
            stats.grid_nodes = 0;
            resolveAllPairs(rects, &stats);
        }

        var center_x: f32 = 0;
        var center_y: f32 = 0;
        for (rects) |rect| {
            center_x += rect.centerX();
            center_y += rect.centerY();
        }
        const inv_count = 1.0 / @as(f32, @floatFromInt(rects.len));
        center_x *= inv_count;
        center_y *= inv_count;

        for (rects) |*rect| {
            rect.displacement_x += (rect.original_x - rect.x) * anchor_strength;
            rect.displacement_y += (rect.original_y - rect.y) * anchor_strength;

            rect.displacement_x += (center_x - rect.centerX()) * compactness_strength;
            rect.displacement_y += (center_y - rect.centerY()) * compactness_strength;

            clampVector(&rect.displacement_x, &rect.displacement_y, max_step);
        }

        var max_movement: f32 = 0;
        for (rects) |*rect| {
            rect.velocity_x = rect.velocity_x * damping + rect.displacement_x;
            rect.velocity_y = rect.velocity_y * damping + rect.displacement_y;
            clampVector(&rect.velocity_x, &rect.velocity_y, max_step);

            rect.x += rect.velocity_x;
            rect.y += rect.velocity_y;

            const movement = @sqrt(rect.velocity_x * rect.velocity_x + rect.velocity_y * rect.velocity_y);
            if (movement > max_movement) {
                max_movement = movement;
            }
        }

        if (max_movement < stop_epsilon) {
            stats.converged = true;
            break;
        }
    }

    return stats;
}
