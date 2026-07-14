import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(),
}));

import { lookup } from "node:dns/promises";
import { assertSafeTarget, safeFetch, UnsafeTargetError } from "./ssrf-guard";

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

describe("safeFetch", () => {
  beforeEach(() => {
    const lookupMock = vi.mocked(lookup);
    lookupMock.mockReset();
    // Mock all lookups to return a public IP by default
    lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as any);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows a redirect chain and returns the final response", async () => {
    const fetchMock = vi.mocked(global.fetch);

    // First request: 302 redirect to example2.com
    fetchMock.mockResolvedValueOnce({
      status: 302,
      headers: {
        get: (key: string) =>
          key === "location" ? "https://example2.com/" : null,
      },
    } as unknown as Response);

    // Second request: 200 with body
    fetchMock.mockResolvedValueOnce({
      status: 200,
      headers: { get: () => null },
      text: vi.fn().mockResolvedValue("success"),
    } as unknown as Response);

    const result = await safeFetch("https://example.com/");

    expect(result.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws UnsafeTargetError when redirects exceed MAX_REDIRECTS (3)", async () => {
    const fetchMock = vi.mocked(global.fetch);

    // Mock 4 consecutive redirects (this exceeds MAX_REDIRECTS=3 and should fail on 4th iteration)
    fetchMock.mockResolvedValue({
      status: 302,
      headers: {
        get: (key: string) =>
          key === "location" ? "https://example.com/page" : null,
      },
    } as unknown as Response);

    await expect(safeFetch("https://example.com/")).rejects.toThrow(
      UnsafeTargetError
    );
    expect(fetchMock).toHaveBeenCalledTimes(4); // MAX_REDIRECTS + 1 attempts
  });

  it("rejects when a redirect target resolves to a private IP (per-hop re-validation)", async () => {
    const fetchMock = vi.mocked(global.fetch);
    const lookupMock = vi.mocked(lookup);

    // First request succeeds with a redirect to internal.example.com
    fetchMock.mockResolvedValueOnce({
      status: 302,
      headers: {
        get: (key: string) =>
          key === "location" ? "https://internal.example.com/" : null,
      },
    } as unknown as Response);

    // Mock lookup: first call returns public IP, second call returns private IP
    lookupMock
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }] as any)
      .mockResolvedValueOnce([{ address: "10.0.0.5", family: 4 }] as any); // private

    await expect(safeFetch("https://example.com/")).rejects.toThrow(
      UnsafeTargetError
    );
    // First fetch should succeed, but the redirect validation should fail
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("normalizes scheme-less URLs before fetch", async () => {
    const fetchMock = vi.mocked(global.fetch);

    fetchMock.mockResolvedValueOnce({
      status: 200,
      headers: { get: () => null },
    } as unknown as Response);

    await safeFetch("example.com");

    // Verify fetch was called with the normalized https:// URL
    const callArg = fetchMock.mock.calls[0]?.[0];
    expect(callArg).toBe("https://example.com/");
  });
});
