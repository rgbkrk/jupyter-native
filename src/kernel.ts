import {} from "child_process";
import { EventEmitter } from "events";

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
