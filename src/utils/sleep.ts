import { EventEmitter } from "node:events";
import { waitFor } from "wait-for-event";

export const sleep = (ms: number): Promise<any> =>
  new Promise((s) => setTimeout(s, ms));

export const waitForever = (): Promise<void> => {
  return waitFor("", new EventEmitter());
};
