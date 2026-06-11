export function extractPublicId(url: string): string | null {
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;
  const pathWithVersion = parts[1];
  const pathParts = pathWithVersion.split("/");
  if (pathParts[0].startsWith("v")) {
    pathParts.shift();
  }
  const pathWithoutVersion = pathParts.join("/");
  const lastDotIndex = pathWithoutVersion.lastIndexOf(".");
  if (lastDotIndex === -1) return pathWithoutVersion;
  return pathWithoutVersion.substring(0, lastDotIndex);
}
