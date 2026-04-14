const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.resolveTargetQuery(.{
        .cpu_arch = .wasm32,
        .os_tag = .freestanding,
    });

    const optimize = b.standardOptimizeOption(.{});
    const wasm_module = b.createModule(.{
        .root_source_file = b.path("zig-src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const wasm = b.addExecutable(.{
        .name = "main",
        .root_module = wasm_module,
    });
    wasm.entry = .disabled;
    wasm.rdynamic = true;

    b.installArtifact(wasm);

    const test_module = b.createModule(.{
        .root_source_file = b.path("zig-src/main.zig"),
        .target = b.graph.host,
        .optimize = optimize,
    });
    const tests = b.addTest(.{
        .root_module = test_module,
    });

    const test_step = b.step("test", "Run Zig tests");
    test_step.dependOn(&tests.step);
}
