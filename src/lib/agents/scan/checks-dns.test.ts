import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:dns/promises", () => ({
  resolveTxt: vi.fn(),
}));

import { resolveTxt } from "node:dns/promises";
import { checkDNSEmail } from "./checks";

describe("checkDNSEmail", () => {
  beforeEach(() => {
    vi.mocked(resolveTxt).mockReset();
  });

  it("marks SPF as No aplica when there is no record", async () => {
    vi.mocked(resolveTxt).mockRejectedValue(new Error("ENOTFOUND"));
    const result = await checkDNSEmail("example.com");
    const spf = result.points.find((p) => p.point.includes("SPF"));
    expect(spf?.estado).toBe("No aplica");
  });

  it("marks SPF as Aprobado when it ends in -all", async () => {
    vi.mocked(resolveTxt).mockImplementation(async (name: string) => {
      if (name === "example.com") return [["v=spf1 include:_spf.google.com -all"]];
      throw new Error("ENOTFOUND");
    });
    const result = await checkDNSEmail("example.com");
    const spf = result.points.find((p) => p.point.includes("SPF"));
    expect(spf?.estado).toBe("Aprobado");
  });

  it("marks SPF as Fallido when it doesn't end in -all", async () => {
    vi.mocked(resolveTxt).mockImplementation(async (name: string) => {
      if (name === "example.com") return [["v=spf1 include:_spf.google.com ~all"]];
      throw new Error("ENOTFOUND");
    });
    const result = await checkDNSEmail("example.com");
    const spf = result.points.find((p) => p.point.includes("SPF"));
    expect(spf?.estado).toBe("Fallido");
  });

  it("marks DMARC as Aprobado with policy reject", async () => {
    vi.mocked(resolveTxt).mockImplementation(async (name: string) => {
      if (name === "_dmarc.example.com") return [["v=DMARC1; p=reject;"]];
      throw new Error("ENOTFOUND");
    });
    const result = await checkDNSEmail("example.com");
    const dmarc = result.points.find((p) => p.point.includes("DMARC"));
    expect(dmarc?.estado).toBe("Aprobado");
  });

  it("returns all 3 DNS/email points", async () => {
    vi.mocked(resolveTxt).mockRejectedValue(new Error("ENOTFOUND"));
    const result = await checkDNSEmail("example.com");
    expect(result.category).toBe("DNS/Email");
    expect(result.points).toHaveLength(3);
  });
});
