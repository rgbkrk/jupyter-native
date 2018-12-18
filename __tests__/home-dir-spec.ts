import { homeDir } from "../src/home-dir";

describe("home directory lookups work cross platform", () => {
  let originalProcess: Readonly<typeof process>;

  beforeAll(() => {
    originalProcess = Object.freeze(Object.assign({}, process));
  });

  it("figures out the right home directory on Darwin (macOS)", () => {
    Object.defineProperty(process, "platform", {
      value: "darwin"
    });
    process.env.HOME = "/cool/path";
    expect(homeDir()).toEqual("/cool/path");
  });

  it("figures out the right home directory on windows", () => {
    Object.defineProperty(process, "platform", {
      value: "win32"
    });
    process.env.USERPROFILE = "C:\\whatevs";
    expect(homeDir()).toEqual("C:\\whatevs");
  });

  afterAll(() => {
    Object.defineProperty(process, "platform", {
      value: originalProcess.platform
    });

    Object.assign(process.env, originalProcess.env);
  });
});
