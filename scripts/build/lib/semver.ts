/**
 * Minimal strict-SemVer (`MAJOR.MINOR.PATCH`, no pre-release/build metadata
 * -- Contract §4.2) comparison, matching this Story's version-ordering AC:
 * `"1.0.0"` vs `"0.1.0"` vs `"1.10.0"` must sort numerically per component,
 * not lexicographically ("1.10.0" lexicographically sorts before "1.2.0",
 * which is wrong).
 *
 * No dependency added for this -- the comparison is a few lines and the
 * manifest schema already constrains the input shape
 * (`^\d+\.\d+\.\d+$`, `registry/schemas/manifest.schema.json`).
 */

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

const STRICT_SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseSemVer(version: string): SemVer {
  const match = STRICT_SEMVER_PATTERN.exec(version);
  if (!match) {
    throw new Error(`not a valid strict MAJOR.MINOR.PATCH semver: "${version}"`);
  }
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

/** Ascending comparator: negative if `a` < `b`, positive if `a` > `b`, 0 if equal. */
export function compareSemVer(a: string, b: string): number {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

/** Returns a new array, sorted ascending. */
export function sortSemVerAscending(versions: string[]): string[] {
  return [...versions].sort(compareSemVer);
}

/** Returns the highest version by numeric MAJOR.MINOR.PATCH comparison. */
export function maxSemVer(versions: string[]): string {
  if (versions.length === 0) {
    throw new Error("maxSemVer: versions[] is empty");
  }
  const sorted = sortSemVerAscending(versions);
  return sorted[sorted.length - 1] as string;
}
