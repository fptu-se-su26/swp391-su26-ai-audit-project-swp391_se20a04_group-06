import { HttpError } from "../errors/HttpError";

const LOCAL_CLIENT_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

const DEVELOPMENT_TUNNEL_SUFFIXES = [
  ".ngrok-free.app",
  ".ngrok-free.dev",
];

function getConfiguredClientOrigins(): Set<string> {
  const configuredOrigins = [
    process.env.CLIENT_URL,
    process.env.ALLOWED_CLIENT_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return new Set([...LOCAL_CLIENT_ORIGINS, ...configuredOrigins]);
}

function isDevelopmentTunnelOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === "production") return false;

  try {
    const url = new URL(origin);
    return (
      url.protocol === "https:" &&
      DEVELOPMENT_TUNNEL_SUFFIXES.some(
        (suffix) =>
          url.hostname.endsWith(suffix) && url.hostname.length > suffix.length,
      )
    );
  } catch {
    return false;
  }
}

export function isAllowedClientOrigin(origin?: string): boolean {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/+$/, "");
  return (
    getConfiguredClientOrigins().has(normalizedOrigin) ||
    isDevelopmentTunnelOrigin(normalizedOrigin)
  );
}

export function rejectDisallowedOrigin(origin?: string): HttpError {
  return new HttpError(
    403,
    `Nguồn truy cập không được phép${origin ? `: ${origin}` : ""}`,
  );
}
