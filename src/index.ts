#!/usr/bin/env node
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import {
  BenchmarkRpc,
  createVrfAccount,
  RequestRandomnessCPI,
  Sandbox,
  setupOracleQueue,
  testCallback,
  updateProgram,
  verifyProof,
  watchAccount,
} from "./actions";
import { DEFAULT_CLUSTER, DEFAULT_RPC_URL } from "./const";

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
        yarg.option("no-example", {
          type: "boolean",
          describe: "ignore example program state and callback",
          default: false,
        });
      },
      createVrfAccount
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
      `verify [vrfKey]`,
      "verify the VRF proof",
      (yarg) => {
        yarg.positional("vrfKey", {
          type: "string",
          describe: "",
          demand: true,
        });
        yarg.option("all", {
          type: "boolean",
          describe: "verify all remaining proof txn",
        });
      },
      verifyProof
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
      `request [vrfKey]`,
      "Request randomness with a CPI call",
      (yarg) => {
        yarg.positional("vrfKey", {
          type: "string",
          describe: "public key",
          demand: true,
        });
      },
      RequestRandomnessCPI
    )
    .command(
      `benchmark [vrfKey]`,
      "Measure the latency between a request randomness instruction and the returned result",
      (yarg) => {
        yarg.positional("vrfKey", {
          type: "string",
          describe: "public key",
          demand: false,
        });
      },
      BenchmarkRpc
    )
    .command(`sandbox`, "Sandbox", (yarg) => {}, Sandbox)
    .options({
      payer: {
        type: "string",
        describe: "filesystem path of keypair",
        demand: true,
        default: "secrets/payer-keypair.json",
      },
      rpcUrl: {
        type: "string",
        describe: "override default RPC server",
        demand: true,
        default: DEFAULT_RPC_URL,
      },
      cluster: {
        type: "string",
        describe: "Solana cluster to interact with",
        demand: true,
        default: DEFAULT_CLUSTER,
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
