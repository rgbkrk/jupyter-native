import { EventEmitter } from "events";

import {} from "child_process";

export type KernelOpts = {};

export class Kernel extends EventEmitter {
  opts: KernelOpts;
  // private process:

  constructor(opts: KernelOpts) {
    super();
    this.opts = opts;
  }

  launch() {}
}
