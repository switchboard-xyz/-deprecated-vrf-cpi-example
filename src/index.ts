#!/usr/bin/env node
import dotenv from "dotenv";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import {
  createVrfAccount,
  requestRandomness,
  Sandbox,
  setupOracleQueue,
  testCallback,
  updateProgram,
  watchAccount,
} from "./actions";

dotenv.config();

async function main(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const argv = yargs(hideBin(process.argv))
    .command(`setup`, "", () => {}, setupOracleQueue)
    .command(
      `create [queueKey]`,
      "create a new vrf account for a given queue",
      (yarg) => {
        yarg.positional("queueKey", {
          type: "string",
          describe:
            "public key of the oracle queue that the aggregator will belong to",
          demand: true,
        });
        yarg.option("keypair", {
          type: "string",
          describe:
            "filesystem path to keypair that will store the vrf account",
        });
        yarg.option("maxResult", {
          type: "string",
          describe: "maximum result returned from vrf buffer",
          default: "256000",
        });
      },
      createVrfAccount
    )
    .command(
      `request [vrfKey]`,
      "request randomness for a VRF account",
      (yarg) => {
        yarg.positional("keypair", {
          type: "string",
          describe: "public key of the VRF account to request randomness for",
          demand: true,
        });
      },
      requestRandomness
    )
    .command(
      `update [stateKey]`,
      "update on-chain account",
      (yarg) => {
        yarg.positional("stateKey", {
          type: "string",
          describe:
            "public key of the example program state to read and update vrf_account",
          demand: true,
        });
      },
      updateProgram
    )
    .command(
      `test [vrfKey] [oracleKey]`,
      "",
      (yarg) => {
        yarg.positional("vrfKey", {
          type: "string",
          describe: "",
          demand: true,
        });
        yarg.positional("oracleKey", {
          type: "string",
          describe: "",
          demand: true,
        });
      },
      testCallback
    )
    .command(
      `watch [pubkey]`,
      "watch VRF account onchain",
      (yarg) => {
        yarg.positional("pubkey", {
          type: "string",
          describe: "public key of the account to watch",
          demand: true,
        });
      },
      watchAccount
    )
    .command(
      `sandbox [vrfKey]`,
      "Sandbox",
      (yarg) => {
        yarg.positional("vrfKey", {
          type: "string",
          describe: "public key",
          demand: false,
        });
      },
      Sandbox
    )
    .options({
      payer: {
        type: "string",
        describe: "filesystem path of keypair",
        demand: true,
        default: "secrets/payer-keypair.json",
      },
    })
    .example("$0 setup", "test")
    .parse();
}
main().then(
  () => {
    return;
  },
  (error) => {
    console.error(error);
    return;
  }
);

export {};
