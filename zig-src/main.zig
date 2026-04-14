const std = @import("std");
const builtin = @import("builtin");

const host = if (builtin.target.os.tag == .freestanding) struct {
    extern "env" fn zigLogDebug(ptr: [*]const u8, len: usize) void;
    extern "env" fn zigLogInfo(ptr: [*]const u8, len: usize) void;
    extern "env" fn zigLogWarn(ptr: [*]const u8, len: usize) void;
    extern "env" fn zigLogError(ptr: [*]const u8, len: usize) void;
} else struct {
    fn zigLogDebug(_: [*]const u8, _: usize) void {}
    fn zigLogInfo(_: [*]const u8, _: usize) void {}
    fn zigLogWarn(_: [*]const u8, _: usize) void {}
    fn zigLogError(_: [*]const u8, _: usize) void {}
};

const LogLevel = enum {
    debug,
    info,
    warn,
    err,
};

fn logMessage(level: LogLevel, message: []const u8) void {
    switch (level) {
        .debug => host.zigLogDebug(message.ptr, message.len),
        .info => host.zigLogInfo(message.ptr, message.len),
        .warn => host.zigLogWarn(message.ptr, message.len),
        .err => host.zigLogError(message.ptr, message.len),
    }
}

fn logFmt(level: LogLevel, comptime fmt: []const u8, args: anytype) void {
    var buffer: [256]u8 = undefined;
    const message = std.fmt.bufPrint(&buffer, fmt, args) catch "zig log formatting failed";
    logMessage(level, message);
}

const layout_rect_stride: usize = 4;
/// Packed rect record in `layout_input` / `layout_output`: x, y, w, h.
const layout_field = struct {
    const x: usize = 0;
    const y: usize = 1;
    const w: usize = 2;
    const h: usize = 3;
};

const max_layout_rects: usize = 8192;
/// Maximum number of relaxation iterations per solve.
const layout_max_iterations: usize = 48;
/// Fixed broad-phase grid cell size in world units.
const layout_grid_cell_size: f32 = 128.0;
/// Fraction of penetration resolved per overlap pair each iteration.
const layout_separation_strength: f32 = 1.0;
/// Weak pull back toward each rectangle's original position.
/// Small but non-zero so layouts do not drift arbitrarily far from the user's composition.
const layout_anchor_strength: f32 = 0.0001;
/// Very weak pull toward the overall layout center.
/// Kept weaker than the anchor so compactness does not dominate arrangement preservation.
const layout_compactness_strength: f32 = 0.0001;
/// Velocity damping used to suppress oscillation.
const layout_damping: f32 = 0.6;
/// Maximum movement length for one rectangle in a single iteration.
const layout_max_step: f32 = 192.0;
/// Desired empty space between solved rectangles, modeled as collision inflation.
const layout_target_gap: f32 = 8.0;
/// Early-out threshold when movement becomes negligible.
const layout_stop_epsilon: f32 = 0.02;

var layout_rect_count: u32 = 0;
var layout_input: [max_layout_rects * layout_rect_stride]f32 = undefined;
var layout_output: [max_layout_rects * layout_rect_stride]f32 = undefined;
var layout_solver_rects: [max_layout_rects]LayoutRect = undefined;
const layout_grid_bucket_count: usize = 8192;
const layout_grid_max_nodes: usize = max_layout_rects * 32;
var layout_grid_bucket_heads: [layout_grid_bucket_count]i32 = undefined;
var layout_grid_nodes: [layout_grid_max_nodes]GridNode = undefined;
var layout_candidate_seen_stamp: [max_layout_rects]u32 = [_]u32{0} ** max_layout_rects;

const LayoutSolveStats = struct {
    iterations: u32 = 0,
    pair_checks: u32 = 0,
    overlaps: u32 = 0,
    converged: bool = false,
    grid_nodes: u32 = 0,
    used_grid: bool = false,
};

const GridNode = struct {
    cell_x: i32,
    cell_y: i32,
    rect_index: u32,
    next: i32,
};

const LayoutRect = struct {
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

    fn centerX(self: LayoutRect) f32 {
        return self.x + self.w * 0.5;
    }

    fn centerY(self: LayoutRect) f32 {
        return self.y + self.h * 0.5;
    }

    fn inflatedHalfWidth(self: LayoutRect) f32 {
        return self.w * 0.5 + layout_target_gap * 0.5;
    }

    fn inflatedHalfHeight(self: LayoutRect) f32 {
        return self.h * 0.5 + layout_target_gap * 0.5;
    }

    fn originalCenterX(self: LayoutRect) f32 {
        return self.original_x + self.w * 0.5;
    }

    fn originalCenterY(self: LayoutRect) f32 {
        return self.original_y + self.h * 0.5;
    }
};

fn absf(value: f32) f32 {
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

fn cellCoord(value: f32) i32 {
    return @as(i32, @intFromFloat(@floor(value / layout_grid_cell_size)));
}

fn hashCell(cell_x: i32, cell_y: i32) usize {
    const x: u32 = @bitCast(cell_x);
    const y: u32 = @bitCast(cell_y);
    const mixed = x *% 73856093 ^ y *% 19349663;
    return mixed % layout_grid_bucket_count;
}

fn insertGridNode(node_count: *usize, rect_index: usize, cell_x: i32, cell_y: i32) bool {
    if (node_count.* >= layout_grid_max_nodes) {
        return false;
    }
    const bucket = hashCell(cell_x, cell_y);
    layout_grid_nodes[node_count.*] = .{
        .cell_x = cell_x,
        .cell_y = cell_y,
        .rect_index = @intCast(rect_index),
        .next = layout_grid_bucket_heads[bucket],
    };
    layout_grid_bucket_heads[bucket] = @intCast(node_count.*);
    node_count.* += 1;
    return true;
}

fn buildSpatialGrid(rects: []LayoutRect, stats: *LayoutSolveStats) bool {
    @memset(&layout_grid_bucket_heads, -1);
    var node_count: usize = 0;

    for (rects, 0..) |rect, rect_index| {
        const min_x = rect.x - layout_target_gap * 0.5;
        const min_y = rect.y - layout_target_gap * 0.5;
        const max_x = rect.x + rect.w + layout_target_gap * 0.5;
        const max_y = rect.y + rect.h + layout_target_gap * 0.5;
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

fn resolveAllPairs(rects: []LayoutRect, stats: *LayoutSolveStats) void {
    var i: usize = 0;
    while (i < rects.len) : (i += 1) {
        var j: usize = i + 1;
        while (j < rects.len) : (j += 1) {
            resolveOverlap(&rects[i], &rects[j], stats);
        }
    }
}

fn resolveSpatialPairs(rects: []LayoutRect, stats: *LayoutSolveStats) void {
    // Candidate dedupe is only valid inside one broad-phase pass.
    // Reset on entry so marks from previous iterations cannot suppress valid pairs.
    @memset(&layout_candidate_seen_stamp, 0);
    var query_stamp: u32 = 0;

    for (rects, 0..) |rect, rect_index| {
        query_stamp +%= 1;
        if (query_stamp == 0) {
            @memset(&layout_candidate_seen_stamp, 0);
            query_stamp = 1;
        }

        const min_x = rect.x - layout_target_gap * 0.5;
        const min_y = rect.y - layout_target_gap * 0.5;
        const max_x = rect.x + rect.w + layout_target_gap * 0.5;
        const max_y = rect.y + rect.h + layout_target_gap * 0.5;
        const cell_min_x = cellCoord(min_x);
        const cell_min_y = cellCoord(min_y);
        const cell_max_x = cellCoord(max_x);
        const cell_max_y = cellCoord(max_y);

        var cy = cell_min_y;
        while (cy <= cell_max_y) : (cy += 1) {
            var cx = cell_min_x;
            while (cx <= cell_max_x) : (cx += 1) {
                const bucket = hashCell(cx, cy);
                var node_index = layout_grid_bucket_heads[bucket];
                while (node_index >= 0) {
                    const node = layout_grid_nodes[@intCast(node_index)];
                    if (node.cell_x == cx and node.cell_y == cy) {
                        const candidate_index: usize = node.rect_index;
                        if (candidate_index > rect_index and layout_candidate_seen_stamp[candidate_index] != query_stamp) {
                            layout_candidate_seen_stamp[candidate_index] = query_stamp;
                            resolveOverlap(&rects[rect_index], &rects[candidate_index], stats);
                        }
                    }
                    node_index = node.next;
                }
            }
        }
    }
}

fn resolveOverlap(a: *LayoutRect, b: *LayoutRect, stats: *LayoutSolveStats) void {
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
        const push = overlap_x * layout_separation_strength * 0.5;
        a.displacement_x -= dir * push;
        b.displacement_x += dir * push;
        return;
    }

    const dir = stableSign(delta_y, b.originalCenterY() - a.originalCenterY());
    const push = overlap_y * layout_separation_strength * 0.5;
    a.displacement_y -= dir * push;
    b.displacement_y += dir * push;
}

fn solveLayout(rects: []LayoutRect) LayoutSolveStats {
    var stats = LayoutSolveStats{};
    if (rects.len == 0) {
        stats.converged = true;
        return stats;
    }

    var iteration: usize = 0;
    while (iteration < layout_max_iterations) : (iteration += 1) {
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
            rect.displacement_x += (rect.original_x - rect.x) * layout_anchor_strength;
            rect.displacement_y += (rect.original_y - rect.y) * layout_anchor_strength;

            rect.displacement_x += (center_x - rect.centerX()) * layout_compactness_strength;
            rect.displacement_y += (center_y - rect.centerY()) * layout_compactness_strength;

            clampVector(&rect.displacement_x, &rect.displacement_y, layout_max_step);
        }

        var max_movement: f32 = 0;
        for (rects) |*rect| {
            rect.velocity_x = rect.velocity_x * layout_damping + rect.displacement_x;
            rect.velocity_y = rect.velocity_y * layout_damping + rect.displacement_y;
            clampVector(&rect.velocity_x, &rect.velocity_y, layout_max_step);

            rect.x += rect.velocity_x;
            rect.y += rect.velocity_y;

            const movement = @sqrt(rect.velocity_x * rect.velocity_x + rect.velocity_y * rect.velocity_y);
            if (movement > max_movement) {
                max_movement = movement;
            }
        }

        if (max_movement < layout_stop_epsilon) {
            stats.converged = true;
            break;
        }
    }

    return stats;
}

export fn setLayoutRectCount(count: u32) u32 {
    logFmt(.info, "requested rect count: {}", .{count});
    if (count > max_layout_rects) {
        layout_rect_count = 0;
        logFmt(.warn, "rejected rect count {} > max {}", .{ count, max_layout_rects });
        return 0;
    }
    layout_rect_count = count;
    logFmt(.info, "accepted rect count: {}", .{count});
    return 1;
}

export fn getLayoutRectCount() u32 {
    return layout_rect_count;
}

export fn getLayoutInputPtr() [*]f32 {
    return &layout_input;
}

export fn getLayoutOutputPtr() [*]f32 {
    return &layout_output;
}

export fn autoLayout() void {
    logFmt(.info, "autoLayout start: {} rects", .{layout_rect_count});
    const rect_count: usize = @intCast(layout_rect_count);

    for (0..rect_count) |i| {
        const base = i * layout_rect_stride;
        const x = layout_input[base + layout_field.x];
        const y = layout_input[base + layout_field.y];
        const w = layout_input[base + layout_field.w];
        const h = layout_input[base + layout_field.h];
        layout_solver_rects[i] = .{
            .x = x,
            .y = y,
            .w = w,
            .h = h,
            .original_x = x,
            .original_y = y,
        };
    }

    const stats = solveLayout(layout_solver_rects[0..rect_count]);

    for (0..rect_count) |i| {
        const base = i * layout_rect_stride;
        const rect = layout_solver_rects[i];
        layout_output[base + layout_field.x] = rect.x;
        layout_output[base + layout_field.y] = rect.y;
        layout_output[base + layout_field.w] = rect.w;
        layout_output[base + layout_field.h] = rect.h;
    }
    logFmt(.info, "iterations: {}", .{stats.iterations});
    logFmt(.info, "pair checks: {}", .{stats.pair_checks});
    logFmt(.info, "overlaps resolved: {}", .{stats.overlaps});
    logFmt(.info, "broad phase: {s}", .{if (stats.used_grid) "grid" else "all-pairs fallback"});
    logFmt(.info, "grid nodes: {}", .{stats.grid_nodes});
    logFmt(.info, "converged: {}", .{stats.converged});
    logFmt(.info, "summary: rects={}, iterations={}, pair_checks={}, overlaps={}, broad_phase={s}, grid_nodes={}, converged={}", .{
        layout_rect_count,
        stats.iterations,
        stats.pair_checks,
        stats.overlaps,
        if (stats.used_grid) "grid" else "all-pairs fallback",
        stats.grid_nodes,
        stats.converged,
    });
}

test "auto layout separates overlapping rects and preserves size" {
    try std.testing.expectEqual(@as(u32, 1), setLayoutRectCount(2));
    const input = getLayoutInputPtr();
    input[0] = 0;
    input[1] = 0;
    input[2] = 10;
    input[3] = 10;
    input[4] = 2;
    input[5] = 2;
    input[6] = 10;
    input[7] = 10;

    autoLayout();

    const output = getLayoutOutputPtr();
    try std.testing.expectEqual(@as(f32, 10), output[2]);
    try std.testing.expectEqual(@as(f32, 10), output[3]);
    try std.testing.expectEqual(@as(f32, 10), output[6]);
    try std.testing.expectEqual(@as(f32, 10), output[7]);

    const rect_a = LayoutRect{
        .x = output[0],
        .y = output[1],
        .w = output[2],
        .h = output[3],
        .original_x = output[0],
        .original_y = output[1],
    };
    const rect_b = LayoutRect{
        .x = output[4],
        .y = output[5],
        .w = output[6],
        .h = output[7],
        .original_x = output[4],
        .original_y = output[5],
    };

    const delta_x = rect_b.centerX() - rect_a.centerX();
    const delta_y = rect_b.centerY() - rect_a.centerY();
    const overlap_x = rect_a.inflatedHalfWidth() + rect_b.inflatedHalfWidth() - absf(delta_x);
    const overlap_y = rect_a.inflatedHalfHeight() + rect_b.inflatedHalfHeight() - absf(delta_y);

    try std.testing.expect(output[0] != input[0] or output[1] != input[1] or output[4] != input[4] or output[5] != input[5]);
    try std.testing.expect(overlap_x <= 0 or overlap_y <= 0);
}
