#!/usr/bin/env npx ts-node

import { homeDir } from "../src/home-dir";

import * as expect from "expect";

async function homeTests() {
  const originalContext = {
    process: {
      platform: process.platform,
      env: {
        HOME: process.env.HOME
      }
    }
  };

  // With as darwin
  process.platform = "darwin";
  process.env.HOME = "/cool/path";
  expect(homeDir()).toEqual("/cool/path");

  process.platform = "win32";
  process.env.HOME = "/cool/path";
  process.env.USERPROFILE = "C:\\whatevs";

  expect(homeDir()).toEqual("C:\\whatevs");

  process.platform = originalContext.process.platform;
  Object.assign(process.env, originalContext.process.env);
}

homeTests();
