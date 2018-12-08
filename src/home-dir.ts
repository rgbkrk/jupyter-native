import { join } from "path";

// Converted and re-worked from https://github.com/scottcorgan/home-dir/blob/db4a3c1a5bdee980c676a51248595d77fb19460e/index.js

export function homeDir(subDir?: string) {
  const baseDir =
    process.env[process.platform === "win32" ? "USERPROFILE" : "HOME"];

  if (!baseDir) {
    throw new Error("No home directory defined");
  }

  return subDir ? join(baseDir, subDir) : baseDir;
}
