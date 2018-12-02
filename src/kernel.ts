import { EventEmitter } from "events";

export type KernelOpts = {};

export class Kernel extends EventEmitter {
  private opts: KernelOpts;

  constructor(opts: KernelOpts) {
    super();
    this.opts = opts;
  }
}
