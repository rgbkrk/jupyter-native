/**
 * Path helpers for Jupyter 4.x
 */

import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { homeDir } from "./home-dir";

type PathsOptions = {
  askJupyter?: boolean;
  withSysPrefix?: boolean;
};

type SysPrefixGuessCache = {
  state: "cached" | "ready";
  value: null | string;
};

const sysPrefixCache: SysPrefixGuessCache = {
  state: "ready",
  value: null
};

function accessCheck(d: string) {
  // check if a directory exists and is listable (X_OK)
  if (!fs.existsSync(d)) return false;
  try {
    fs.accessSync(d, fs.constants.X_OK);
  } catch (e) {
    // [WSA]EACCES
    return false;
  }
  return true;
}

function guessSysPrefix(): null | string {
  // inexpensive guess for sysPrefix based on location of `which python`
  // based on shutil.which from Python 3.5

  // only run once:
  if (sysPrefixCache.state === "cached") {
    return sysPrefixCache.value;
  }

  const PATH: string | string[] = (process.env.PATH || "").split(
    path.delimiter
  );
  if (PATH.length === 0) {
    sysPrefixCache.state = "cached";
    sysPrefixCache.value = null;
    return null;
  }

  let pathext = [""];
  if (process.platform === "win32") {
    pathext = (process.env.PATHEXT || "").split(path.delimiter);
  }

  PATH.some(bin => {
    bin = path.resolve(bin);
    const python: string = path.join(bin, "python");

    return pathext.some(ext => {
      const exe = python + ext;
      if (accessCheck(exe)) {
        // PREFIX/bin/python exists, return PREFIX
        // following symlinks
        if (process.platform === "win32") {
          // Windows: Prefix\Python.exe
          sysPrefixCache.value = path.dirname(fs.realpathSync(exe));
        } else {
          // Everywhere else: prefix/bin/python
          sysPrefixCache.value = path.dirname(
            path.dirname(fs.realpathSync(exe))
          );
        }
        sysPrefixCache.state = "cached";
        return true;
      }
      return false;
    });
  });

  // store null as nothing found, but don't run again
  if (sysPrefixCache.value === null) {
    sysPrefixCache.state = "cached";
  }

  return sysPrefixCache.value;
}

type JupyterPathsResponse = {
  runtime: string[];
  config: string[];
  data: string[];
};

let askJupyterPromise: null | Promise<JupyterPathsResponse> = null;

function askJupyter() {
  // ask Jupyter where the paths are
  if (!askJupyterPromise) {
    askJupyterPromise = new Promise((resolve, reject) => {
      exec("jupyter --paths --json", (err, stdout) => {
        if (err) {
          console.warn("Failed to ask Jupyter about its paths: " + err);
          reject(err);
        } else {
          resolve(JSON.parse(stdout.toString().trim()));
        }
      });
    });
  }
  return askJupyterPromise;
}

function systemConfigDirs() {
  const paths = [];
  // System wide for Windows and Unix
  if (process.platform === "win32") {
    paths.push(
      path.resolve(path.join(process.env.PROGRAMDATA || "", "jupyter"))
    );
  } else {
    paths.push("/usr/local/etc/jupyter");
    paths.push("/etc/jupyter");
  }
  return paths;
}

export function configDirs(opts?: PathsOptions): string[] | Promise<string[]> {
  if (opts && opts.askJupyter) {
    return askJupyter()
      .then(paths => paths.config)
      .catch(err => configDirs());
  }

  const paths = [];
  if (process.env.JUPYTER_CONFIG_DIR) {
    paths.push(process.env.JUPYTER_CONFIG_DIR);
  }

  paths.push(homeDir(".jupyter"));
  const systemDirs = systemConfigDirs();

  if (opts && opts.withSysPrefix) {
    return new Promise((resolve, reject) => {
      // deprecated: withSysPrefix expects a Promise
      // but no change in content
      resolve(configDirs());
    });
  }
  // inexpensive guess, based on location of `python` executable
  const sysPrefix = guessSysPrefix();
  if (sysPrefix !== null) {
    const sysPathed = path.join(sysPrefix, "etc", "jupyter");
    if (systemDirs.indexOf(sysPathed) === -1) {
      paths.push(sysPathed);
    }
  }
  return paths.concat(systemDirs);
}

function systemDataDirs() {
  const paths = [];
  // System wide for Windows and Unix
  if (process.platform === "win32") {
    paths.push(
      path.resolve(path.join(process.env.PROGRAMDATA || "", "jupyter"))
    );
  } else {
    paths.push("/usr/local/share/jupyter");
    paths.push("/usr/share/jupyter");
  }
  return paths;
}

/**
 * where the userland data directory resides
 * includes things like the runtime files
 */
function userDataDir(): string {
  // Userland specific
  if (process.platform === "darwin") {
    return homeDir("Library/Jupyter");
  } else if (process.platform === "win32") {
    return path.resolve(path.join(process.env.APPDATA || "", "jupyter"));
  }
  // TODO: respect XDG_DATA_HOME
  return homeDir(".local/share/jupyter");
}

/**
 * dataDirs returns all the expected static directories for this OS.
 * The user of this function should make sure to make sure the directories
 * exist.
 *
 * When withSysPrefix is set, this returns a promise of directories
 */
export function dataDirs(opts?: PathsOptions): string[] | Promise<string[]> {
  if (opts && opts.askJupyter) {
    return (
      askJupyter()
        .then(paths => paths.data)
        // fallback on default
        .catch(err => dataDirs())
    );
  }

  const paths = [];
  if (process.env.JUPYTER_PATH) {
    paths.push(process.env.JUPYTER_PATH);
  }

  paths.push(userDataDir());

  const systemDirs = systemDataDirs();

  if (opts && opts.withSysPrefix) {
    return new Promise((resolve, reject) => {
      // deprecated: withSysPrefix expects a Promise
      // but no change in content
      resolve(dataDirs());
    });
  }
  // inexpensive guess, based on location of `python` executable
  const sysPrefix = guessSysPrefix();
  // If the sys prefix guess was null, don't use it
  if (sysPrefix) {
    const sysPathed = path.join(sysPrefix, "share", "jupyter");
    if (systemDirs.indexOf(sysPathed) === -1) {
      paths.push(sysPathed);
    }
  }
  return paths.concat(systemDirs);
}

export function runtimeDir(opts?: PathsOptions): string | Promise<string> {
  if (opts && opts.askJupyter) {
    return (
      askJupyter()
        .then(paths => paths.runtime[0])
        // fallback on default
        .catch(err => runtimeDir())
    );
  }

  if (process.env.JUPYTER_RUNTIME_DIR) {
    return process.env.JUPYTER_RUNTIME_DIR;
  }

  if (process.env.XDG_RUNTIME_DIR) {
    return path.join(process.env.XDG_RUNTIME_DIR, "jupyter");
  }
  return path.join(userDataDir(), "runtime");
}
