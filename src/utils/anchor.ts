/* eslint-disable unicorn/prefer-module */
import * as anchor from "@project-serum/anchor";
import { Cluster, Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { getSwitchboardPid } from "./switchboard";

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
  payer: Keypair,
  cluster: Cluster,
  rpcUrl: string
): Promise<anchor.Program> {
  const programId = getSwitchboardPid(cluster);
  const connection = new Connection(rpcUrl, {
    commitment: "processed",
  });
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.Provider(connection, wallet, {
    commitment: "processed",
    preflightCommitment: "processed",
  });

  const anchorIdl = await anchor.Program.fetchIdl(programId, provider);
  if (!anchorIdl) {
    throw new Error(`failed to read idl for ${programId}`);
  }

  return new anchor.Program(anchorIdl, programId, provider);
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
export async function loadVrfClientProgram(
  payer: Keypair,
  cluster: Cluster, // should verify example has been deployed
  rpcUrl: string
): Promise<anchor.Program> {
  const programId = loadVrfExamplePid();
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
  });
  const program = await connection.getAccountInfo(programId);
  if (!program) {
    throw new Error(
      `failed to find example program for cluster ${cluster}. did you run 'anchor build && anchor deploy' with the Anchor.toml pointed to cluster ${cluster}`
    );
  }

  // load anchor program from local IDL file
  if (!fs.existsSync(PROGRAM_IDL_PATH)) {
    throw new Error(`Could not find program IDL. Have you run 'anchor build'?`);
  }
  const idl: anchor.Idl = JSON.parse(
    fs.readFileSync(PROGRAM_IDL_PATH, "utf-8")
  );

  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.Provider(connection, wallet, {
    commitment: "confirmed",
  });

  return new anchor.Program(idl, programId, provider);
}
