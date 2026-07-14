import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:tls", () => ({
  default: { connect: vi.fn() },
}));

import tls from "node:tls";
import { checkTLS } from "./checks";

function fakeSocket() {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  return {
    on: (event: string, cb: (...args: unknown[]) => void) => {
      handlers[event] = cb;
    },
    end: vi.fn(),
    destroy: vi.fn(),
    getPeerCertificate: vi.fn(),
    getProtocol: vi.fn(),
    getCipher: vi.fn(),
    trigger: (event: string, ...args: unknown[]) => handlers[event]?.(...args),
  };
}

describe("checkTLS", () => {
  beforeEach(() => {
    vi.mocked(tls.connect).mockReset();
  });

  it("marks the certificate point as Pendiente on a connection error", async () => {
    const socket = fakeSocket();
    vi.mocked(tls.connect).mockImplementation((..._args: unknown[]) => {
      queueMicrotask(() => socket.trigger("error", new Error("connection refused")));
      return socket as never;
    });

    const result = await checkTLS("unreachable.example.com");
    const certPoint = result.points.find((p) => p.point.includes("Certificado válido"));
    expect(certPoint?.estado).toBe("Pendiente");
  });

  it("approves a valid cert with TLS1.3 and a strong cipher", async () => {
    const socket = fakeSocket();
    const now = new Date();
    const validFrom = new Date(now.getTime() - 86_400_000).toUTCString();
    const validTo = new Date(now.getTime() + 86_400_000 * 90).toUTCString();

    socket.getPeerCertificate.mockReturnValue({
      subject: { CN: "example.com" },
      valid_from: validFrom,
      valid_to: validTo,
      fingerprint: "AA:BB",
      issuerCertificate: {
        fingerprint: "CC:DD",
        issuerCertificate: undefined,
      },
    });
    socket.getProtocol.mockReturnValue("TLSv1.3");
    socket.getCipher.mockReturnValue({ name: "TLS_AES_128_GCM_SHA256" });

    vi.mocked(tls.connect).mockImplementation((..._args: unknown[]) => {
      queueMicrotask(() => socket.trigger("secureConnect"));
      return socket as never;
    });

    const result = await checkTLS("example.com");
    const certPoint = result.points.find((p) => p.point.includes("Certificado válido"));
    const protocolPoint = result.points.find((p) => p.point.includes("protocolos obsoletos"));
    expect(certPoint?.estado).toBe("Aprobado");
    expect(protocolPoint?.estado).toBe("Aprobado");
  });

  it("returns all 5 TLS points, with SSL Labs marked No aplica", async () => {
    const socket = fakeSocket();
    socket.getPeerCertificate.mockReturnValue({
      subject: { CN: "example.com" },
      valid_from: new Date().toUTCString(),
      valid_to: new Date(Date.now() + 86_400_000).toUTCString(),
      fingerprint: "AA:BB",
      issuerCertificate: undefined,
    });
    socket.getProtocol.mockReturnValue("TLSv1.2");
    socket.getCipher.mockReturnValue({ name: "ECDHE-RSA-AES128-GCM-SHA256" });

    vi.mocked(tls.connect).mockImplementation((..._args: unknown[]) => {
      queueMicrotask(() => socket.trigger("secureConnect"));
      return socket as never;
    });

    const result = await checkTLS("example.com");
    expect(result.category).toBe("TLS/SSL");
    expect(result.points).toHaveLength(5);
    const sslLabs = result.points.find((p) => p.point.includes("SSL Labs"));
    expect(sslLabs?.estado).toBe("No aplica");
  });
});
