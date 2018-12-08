#!/usr/bin/env npx ts-node

import { homeDir } from "../src/home-dir";

async function homeTests() {
  console.log(homeDir());
  process.env.HOME = "SOMEWHERE";
  console.log(homeDir());
}

homeTests();
