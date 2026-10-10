const std = @import("std");
const builtin = @import("builtin");
const relaxation = @import("relaxation.zig");
const grid_placement = @import("grid_placement.zig");

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

var layout_rect_count: u32 = 0;
var layout_input: [relaxation.max_rects * layout_rect_stride]f32 = undefined;
var layout_output: [relaxation.max_rects * layout_rect_stride]f32 = undefined;
var layout_solver_rects: [relaxation.max_rects]relaxation.Rect = undefined;

export fn setLayoutRectCount(count: u32) u32 {
    logFmt(.info, "requested rect count: {}", .{count});
    if (count > relaxation.max_rects) {
        layout_rect_count = 0;
        logFmt(.warn, "rejected rect count {} > max {}", .{ count, relaxation.max_rects });
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

    const solver_rects = layout_solver_rects[0..rect_count];
    const grid = grid_placement.placeOnGrid(solver_rects);
    logFmt(.info, "grid preprocess: {}x{} cells of {}x{}", .{ grid.columns, grid.rows, grid.cell_w, grid.cell_h });
    const stats = relaxation.solve(solver_rects);

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
    logFmt(.info, "grid cell size: {}", .{stats.grid_cell_size});
    logFmt(.info, "converged: {}", .{stats.converged});
    logFmt(.info, "summary: rects={}, iterations={}, pair_checks={}, overlaps={}, broad_phase={s}, grid_nodes={}, grid_cell_size={}, converged={}", .{
        layout_rect_count,
        stats.iterations,
        stats.pair_checks,
        stats.overlaps,
        if (stats.used_grid) "grid" else "all-pairs fallback",
        stats.grid_nodes,
        stats.grid_cell_size,
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

    const rect_a = relaxation.Rect{
        .x = output[0],
        .y = output[1],
        .w = output[2],
        .h = output[3],
        .original_x = output[0],
        .original_y = output[1],
    };
    const rect_b = relaxation.Rect{
        .x = output[4],
        .y = output[5],
        .w = output[6],
        .h = output[7],
        .original_x = output[4],
        .original_y = output[5],
    };

    const delta_x = rect_b.centerX() - rect_a.centerX();
    const delta_y = rect_b.centerY() - rect_a.centerY();
    const overlap_x = rect_a.inflatedHalfWidth() + rect_b.inflatedHalfWidth() - relaxation.absf(delta_x);
    const overlap_y = rect_a.inflatedHalfHeight() + rect_b.inflatedHalfHeight() - relaxation.absf(delta_y);

    try std.testing.expect(output[0] != input[0] or output[1] != input[1] or output[4] != input[4] or output[5] != input[5]);
    try std.testing.expect(overlap_x <= 0 or overlap_y <= 0);
}

test {
    _ = relaxation;
    _ = grid_placement;
}
