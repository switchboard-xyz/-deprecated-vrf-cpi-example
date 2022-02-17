import { Cluster, clusterApiUrl, Keypair } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config();

export const DEFAULT_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(1));

export const DEFAULT_CLUSTER: Cluster =
  (process.env.CLUSTER as Cluster) ?? "devnet";

export const DEFAULT_RPC_URL =
  process.env.RPC_URL ?? clusterApiUrl(DEFAULT_CLUSTER);
