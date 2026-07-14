import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "node:dns/promises";
import { assertSafeTarget, UnsafeTargetError } from "./ssrf-guard";

describe("assertSafeTarget", () => {
  beforeEach(() => {
    vi.mocked(lookup).mockReset();
  });

  it("rejects a target that resolves to a private IPv4 address", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "10.0.0.5", family: 4 },
    ] as any);
    await expect(assertSafeTarget("internal.example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects loopback", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "127.0.0.1", family: 4 },
    ] as any);
    await expect(assertSafeTarget("localhost")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects the cloud metadata IP", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "169.254.169.254", family: 4 },
    ] as any);
    await expect(assertSafeTarget("metadata.example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects IPv6 loopback", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "::1", family: 6 },
    ] as any);
    await expect(assertSafeTarget("v6local.example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("accepts a public IPv4 address over https", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ] as any);
    const result = await assertSafeTarget("example.com");
    expect(result.hostname).toBe("example.com");
    expect(result.url).toBe("https://example.com/");
  });

  it("defaults to https when no scheme is given", async () => {
    vi.mocked(lookup).mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ] as any);
    const result = await assertSafeTarget("example.com");
    expect(result.url.startsWith("https://")).toBe(true);
  });

  it("rejects a non-http(s) scheme", async () => {
    await expect(assertSafeTarget("ftp://example.com")).rejects.toThrow(
      UnsafeTargetError
    );
  });

  it("rejects a disallowed port", async () => {
    await expect(
      assertSafeTarget("https://example.com:8080")
    ).rejects.toThrow(UnsafeTargetError);
  });

  it("rejects when DNS resolution fails", async () => {
    vi.mocked(lookup).mockRejectedValue(new Error("ENOTFOUND"));
    await expect(assertSafeTarget("nonexistent.invalid")).rejects.toThrow(
      UnsafeTargetError
    );
  });
});
