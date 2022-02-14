import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import chalk from "chalk";

export const CHECK_ICON = chalk.green("\u2714 ");

export const FAILED_ICON = chalk.red("\u2717 ");

export const hex2bin = (hex: string) => {
  return Number.parseInt(hex, 16).toString(2).padStart(8, "0");
};

/* eslint-disable no-control-regex */
export const buffer2string = (buf: Buffer | ArrayBuffer): string => {
  return Buffer.from(buf)
    .toString("utf8")
    .replace(/\u0000/g, ""); // removes padding from onchain fixed sized buffers
};

export const toAccountString = (
  label: string,
  publicKey: PublicKey | string | undefined
): string => {
  if (typeof publicKey === "string") {
    return `${chalk.blue(label.padEnd(24, " "))} ${chalk.yellow(publicKey)}`;
  }
  if (!publicKey) return "";
  return `${chalk.blue(label.padEnd(24, " "))} ${chalk.yellow(
    publicKey.toString()
  )}`;
};

const padTime = (number_: number): string => {
  return number_.toString().padStart(2, "0");
};

export function toDateString(d: Date | undefined): string {
  if (d)
    return `${d.getFullYear()}-${padTime(d.getMonth() + 1)}-${padTime(
      d.getDate()
    )} L`;
  return "";
}

export function anchorBNtoDateString(ts: anchor.BN): string {
  if (!ts.toNumber()) return "N/A";
  return toDateString(new Date(ts.toNumber() * 1000));
}

export function toDateTimeString(d: Date | undefined): string {
  if (d)
    return `${d.getFullYear()}-${padTime(d.getMonth() + 1)}-${padTime(
      d.getDate()
    )} ${padTime(d.getHours())}:${padTime(d.getMinutes())}:${padTime(
      d.getSeconds()
    )} L`;
  return "";
}

export function anchorBNtoDateTimeString(ts: anchor.BN): string {
  if (!ts.toNumber()) return "N/A";
  return toDateTimeString(new Date(ts.toNumber() * 1000));
}
