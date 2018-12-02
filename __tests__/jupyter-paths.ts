import { dataDirs, runtimeDir, configDirs } from "../src/jupyter-paths";

import { execSync } from "child_process";

const actual = JSON.parse(execSync("jupyter --paths --json").toString());

it("matches jupyter's --paths --json command", async () => {
  expect(dataDirs()).toEqual(actual.data);
  expect(runtimeDir()).toEqual(actual.runtime[0]);
  expect(configDirs()).toEqual(actual.config);
});
