const std = @import("std");
const relaxation = @import("relaxation.zig");

/// Desired grid width / height.
const target_aspect: f32 = 4.0 / 3.0;

fn absLogRatio(value: f32, target: f32) f32 {
    return relaxation.absf(@log(value / target));
}

pub const GridStats = struct {
    columns: u32 = 0,
    rows: u32 = 0,
    cell_w: f32 = 0,
    cell_h: f32 = 0,
};

/// Preprocess before relaxation: places rects into a grid whose overall shape is close to 4:3.
/// Cell width is the max rect width, cell height is the max rect height, so every rect fits
/// its cell. Columns are chosen so the grid's width/height ratio is nearest to 4:3, rows = ceil(n / columns). Rects fill cells row by row in
/// input order and are centered in their cell. The grid keeps the center of the original
/// bounding box. `original_x/y` are set to the placed position so relaxation anchors to the grid.
pub fn placeOnGrid(rects: []relaxation.Rect) GridStats {
    var stats = GridStats{};
    if (rects.len == 0) {
        return stats;
    }

    var cell_w: f32 = 0;
    var cell_h: f32 = 0;
    var min_x = rects[0].x;
    var min_y = rects[0].y;
    var max_x = rects[0].x + rects[0].w;
    var max_y = rects[0].y + rects[0].h;
    for (rects) |rect| {
        cell_w = @max(cell_w, rect.w);
        cell_h = @max(cell_h, rect.h);
        min_x = @min(min_x, rect.x);
        min_y = @min(min_y, rect.y);
        max_x = @max(max_x, rect.x + rect.w);
        max_y = @max(max_y, rect.y + rect.h);
    }

    const count: usize = rects.len;
    const pitch_x = cell_w + relaxation.target_gap;
    const pitch_y = cell_h + relaxation.target_gap;

    var columns: usize = 1;
    var best_score: f32 = std.math.floatMax(f32);
    for (1..count + 1) |candidate| {
        const candidate_rows = (count + candidate - 1) / candidate;
        const w = pitch_x * @as(f32, @floatFromInt(candidate)) - relaxation.target_gap;
        const h = pitch_y * @as(f32, @floatFromInt(candidate_rows)) - relaxation.target_gap;
        const score = absLogRatio(w / h, target_aspect);
        if (score < best_score) {
            best_score = score;
            columns = candidate;
        }
    }
    const rows: usize = (count + columns - 1) / columns;

    const grid_w = pitch_x * @as(f32, @floatFromInt(columns)) - relaxation.target_gap;
    const grid_h = pitch_y * @as(f32, @floatFromInt(rows)) - relaxation.target_gap;
    const origin_x = (min_x + max_x) * 0.5 - grid_w * 0.5;
    const origin_y = (min_y + max_y) * 0.5 - grid_h * 0.5;

    for (rects, 0..) |*rect, index| {
        const col: f32 = @floatFromInt(index % columns);
        const row: f32 = @floatFromInt(index / columns);
        rect.x = origin_x + col * pitch_x + (cell_w - rect.w) * 0.5;
        rect.y = origin_y + row * pitch_y + (cell_h - rect.h) * 0.5;
        rect.original_x = rect.x;
        rect.original_y = rect.y;
    }

    stats.columns = @intCast(columns);
    stats.rows = @intCast(rows);
    stats.cell_w = cell_w;
    stats.cell_h = cell_h;
    return stats;
}

test "grid placement fits every rect in its own cell" {
    var rects = [_]relaxation.Rect{
        .{ .x = 0, .y = 0, .w = 10, .h = 20, .original_x = 0, .original_y = 0 },
        .{ .x = 1, .y = 1, .w = 30, .h = 5, .original_x = 1, .original_y = 1 },
        .{ .x = 2, .y = 2, .w = 15, .h = 15, .original_x = 2, .original_y = 2 },
    };
    const stats = placeOnGrid(&rects);
    try std.testing.expectEqual(@as(u32, 2), stats.columns);
    try std.testing.expectEqual(@as(u32, 2), stats.rows);
    try std.testing.expectEqual(@as(f32, 30), stats.cell_w);
    try std.testing.expectEqual(@as(f32, 20), stats.cell_h);

    for (rects, 0..) |a, i| {
        for (rects[i + 1 ..]) |b| {
            const overlap_x = a.inflatedHalfWidth() + b.inflatedHalfWidth() - relaxation.absf(b.centerX() - a.centerX());
            const overlap_y = a.inflatedHalfHeight() + b.inflatedHalfHeight() - relaxation.absf(b.centerY() - a.centerY());
            try std.testing.expect(overlap_x <= 0 or overlap_y <= 0);
        }
    }
}
