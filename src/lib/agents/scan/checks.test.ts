import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./ssrf-guard", () => ({
  safeFetch: vi.fn(),
}));

import { safeFetch } from "./ssrf-guard";
import { checkHeaders, checkCookies, checkVersionLeak, checkExposedFiles } from "./checks";

function mockResponse(
  headers: Record<string, string>,
  status = 200,
  body = ""
): Response {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    status,
    headers: {
      get: (k: string) => lower[k.toLowerCase()] ?? null,
      has: (k: string) => k.toLowerCase() in lower,
    },
    text: async () => body,
  } as unknown as Response;
}

describe("checkHeaders", () => {
  beforeEach(() => {
    vi.mocked(safeFetch).mockReset();
  });

  it("marks CSP as Fallido when the header is absent", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({}));
    const result = await checkHeaders("https://example.com");
    const csp = result.points.find((p) =>
      p.point.includes("Content-Security-Policy")
    );
    expect(csp?.estado).toBe("Fallido");
  });

  it("marks CSP as Aprobado when the header is present", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({ "content-security-policy": "default-src 'self'" })
    );
    const result = await checkHeaders("https://example.com");
    const csp = result.points.find((p) =>
      p.point.includes("Content-Security-Policy")
    );
    expect(csp?.estado).toBe("Aprobado");
  });

  it("returns all 6 header points", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({}));
    const result = await checkHeaders("https://example.com");
    expect(result.category).toBe("Headers");
    expect(result.points).toHaveLength(6);
  });
});

describe("checkCookies", () => {
  beforeEach(() => {
    vi.mocked(safeFetch).mockReset();
  });

  it("marks all cookie points as No aplica when no cookie is set", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({}));
    const result = await checkCookies("https://example.com");
    expect(result.points.every((p) => p.estado === "No aplica")).toBe(true);
  });

  it("marks Secure as Fallido when the cookie lacks the flag", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({ "set-cookie": "session=abc; HttpOnly" })
    );
    const result = await checkCookies("https://example.com");
    const secure = result.points.find((p) => p.point.includes("Secure"));
    expect(secure?.estado).toBe("Fallido");
  });

  it("marks all flags Aprobado when the cookie has Secure, HttpOnly and SameSite", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({
        "set-cookie": "session=abc; Secure; HttpOnly; SameSite=Strict",
      })
    );
    const result = await checkCookies("https://example.com");
    expect(result.points.every((p) => p.estado === "Aprobado")).toBe(true);
  });
});

describe("checkVersionLeak", () => {
  beforeEach(() => {
    vi.mocked(safeFetch).mockReset();
  });

  it("flags a Server header containing a version number", async () => {
    vi.mocked(safeFetch).mockResolvedValue(
      mockResponse({ server: "nginx/1.18.0" })
    );
    const result = await checkVersionLeak("https://example.com");
    const serverPoint = result.points.find((p) =>
      p.point.includes("Server/X-Powered-By")
    );
    expect(serverPoint?.estado).toBe("Fallido");
  });

  it("approves a generic Server header", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({ server: "Vercel" }));
    const result = await checkVersionLeak("https://example.com");
    const serverPoint = result.points.find((p) =>
      p.point.includes("Server/X-Powered-By")
    );
    expect(serverPoint?.estado).toBe("Aprobado");
  });

  it("returns all 4 versions/CVEs points", async () => {
    vi.mocked(safeFetch).mockResolvedValue(mockResponse({ server: "Vercel" }));
    const result = await checkVersionLeak("https://example.com");
    expect(result.category).toBe("Versiones/CVEs");
    expect(result.points).toHaveLength(4);
  });
});

describe("checkExposedFiles", () => {
  beforeEach(() => {
    vi.mocked(safeFetch).mockReset();
  });

  it("approves .env, .git and backups when everything 404s", async () => {
    vi.mocked(safeFetch).mockImplementation(async () => mockResponse({}, 404));
    const result = await checkExposedFiles("https://example.com");
    const env = result.points.find((p) => p.point.startsWith(".env"));
    const git = result.points.find((p) => p.point.startsWith(".git"));
    expect(env?.estado).toBe("Aprobado");
    expect(git?.estado).toBe("Aprobado");
  });

  it("flags .env when it returns 200", async () => {
    vi.mocked(safeFetch).mockImplementation(async (url: string) => {
      if (url.endsWith("/.env")) return mockResponse({}, 200);
      return mockResponse({}, 404);
    });
    const result = await checkExposedFiles("https://example.com");
    const env = result.points.find((p) => p.point.startsWith(".env"));
    expect(env?.estado).toBe("Fallido");
  });

  it("flags directory listing when an autoindex page is found", async () => {
    vi.mocked(safeFetch).mockImplementation(async (url: string) => {
      if (url.includes("/uploads/")) {
        return mockResponse({}, 200, "<html><body>Index of /uploads</body></html>");
      }
      return mockResponse({}, 404);
    });
    const result = await checkExposedFiles("https://example.com");
    const listing = result.points.find((p) =>
      p.point.includes("Listado de directorios")
    );
    expect(listing?.estado).toBe("Fallido");
  });

  it("returns all 5 exposed-files points", async () => {
    vi.mocked(safeFetch).mockImplementation(async () => mockResponse({}, 404));
    const result = await checkExposedFiles("https://example.com");
    expect(result.category).toBe("Archivos Expuestos");
    expect(result.points).toHaveLength(5);
  });
});
