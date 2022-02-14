/* eslint-disable unicorn/prefer-module */
import * as anchor from "@project-serum/anchor";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SBV2_MAINNET_PID } from "@switchboard-xyz/switchboard-v2";
import fs from "node:fs";
import path from "node:path";

// VRF Example program keypair
const PROGRAM_KEYPAIR_PATH = path.join(
  __dirname,
  "../../target/deploy/anchor_vrf_example-keypair.json"
);

// VRF Example program IDL
const PROGRAM_IDL_PATH = path.join(
  __dirname,
  "../../target/idl/anchor_vrf_example.json"
);

/**
 * Load the devnet Switchboard anchor program to create
 * and interact with Switchboard V2 accounts.
 */
export async function loadSwitchboardProgram(
  payer: Keypair
): Promise<anchor.Program> {
  const connection = new Connection("https://switchboard.rpcpool.com/ec20ad2831092cfcef66d677539a", {
    commitment: "confirmed",
  });
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.Provider(connection, wallet, {
    commitment: "processed",
    preflightCommitment: "processed",
  });

  const anchorIdl = await anchor.Program.fetchIdl(SBV2_MAINNET_PID, provider);
  if (!anchorIdl) {
    throw new Error(`failed to read idl for ${SBV2_MAINNET_PID}`);
  }

  return new anchor.Program(anchorIdl, SBV2_MAINNET_PID, provider);
}

export function loadVrfExamplePid(): PublicKey {
  if (!fs.existsSync(PROGRAM_KEYPAIR_PATH)) {
    throw new Error(`Could not find keypair. Have you run 'anchor build'?`);
  }
  const programKeypair = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(PROGRAM_KEYPAIR_PATH, "utf8")))
  );
  return programKeypair.publicKey;
}

/**
 * Load the local VRF anchor program which reads
 * a VRF account and logs its current randomness value.
 */
export function loadVrfExampleProgram(payer: Keypair): anchor.Program {
  const programId = loadVrfExamplePid();

  // load anchor program from local IDL file
  if (!fs.existsSync(PROGRAM_IDL_PATH)) {
    throw new Error(`Could not find program IDL. Have you run 'anchor build'?`);
  }
  const idl: anchor.Idl = JSON.parse(
    fs.readFileSync(PROGRAM_IDL_PATH, "utf-8")
  );
  const connection = new Connection(
    "https://switchboard.rpcpool.com/ec20ad2831092cfcef66d677539a",
    {
      commitment: "confirmed",
    }
  );
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.Provider(connection, wallet, {
    commitment: "confirmed",
  });

  return new anchor.Program(idl, programId, provider);
}
