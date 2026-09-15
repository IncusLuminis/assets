/**
 * Small filesystem helpers shared by `build-theme.ts` and `build-registry.ts`
 * to keep generated output deterministic and writes fail-closed (no
 * partial/corrupt output on error -- Story #1 AC, Arch §49).
 */
import fs from "node:fs";
import path from "node:path";

/**
 * Recursively lists every *file* under `dir`, as POSIX-separated paths
 * relative to `dir`, in a stable sorted order. Directory entries are sorted
 * by name at every level before recursing, so the result order depends only
 * on the file/directory names themselves -- never on filesystem iteration
 * order, which is not guaranteed stable across platforms/runs.
 *
 * Returns `[]` if `dir` does not exist. Symlinks are skipped deliberately --
 * Theme sources in this repo are plain files and directories.
 */
export function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];

  function walk(currentAbs: string, currentRel: string): void {
    const entries = fs
      .readdirSync(currentAbs, { withFileTypes: true })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const entryRel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
      const entryAbs = path.join(currentAbs, entry.name);
      if (entry.isDirectory()) {
        walk(entryAbs, entryRel);
      } else if (entry.isFile()) {
        out.push(entryRel);
      }
    }
  }

  if (fs.existsSync(dir)) walk(dir, "");
  return out.sort();
}

/** Converts a POSIX-relative path into OS-native path segments under `base`. */
export function toOsPath(base: string, posixRelPath: string): string {
  return path.join(base, ...posixRelPath.split("/"));
}

/** Writes `content` to `filePath`, creating parent directories as needed. */
export function writeFileEnsuringDir(filePath: string, content: Buffer | string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

/**
 * Runs `buildFn` against a fresh, empty staging directory, then atomically
 * (via `rename`) replaces `finalDir` with it. `finalDir` is left completely
 * untouched if `buildFn` throws -- so a failed build never leaves a
 * partial/corrupt `finalDir` behind (Arch §49 "publication should appear
 * atomic to consumers"; this Story's fail-closed AC).
 *
 * The staging directory's own name embeds the process id / a timestamp /
 * randomness purely to avoid collisions with concurrent or previously
 * interrupted runs -- it is always deleted or renamed away before this
 * function returns, so none of that ever ends up in `finalDir`'s content or
 * path, and does not affect this Story's build-output determinism AC (which
 * is about `finalDir`'s own bytes, not this transient staging name).
 */
export function buildIntoDirAtomically(
  finalDir: string,
  buildFn: (stagingDir: string) => void
): void {
  const parent = path.dirname(finalDir);
  fs.mkdirSync(parent, { recursive: true });

  const staging = `${finalDir}.staging-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  try {
    buildFn(staging);
  } catch (err) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw err;
  }

  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.renameSync(staging, finalDir);
}
