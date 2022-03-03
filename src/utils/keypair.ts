import { Keypair } from "@solana/web3.js";
import fs from "fs";
import path from "path";

export const loadKeypair = (fsPath: string): Keypair => {
  const keypairPath = fsPath.startsWith("/")
    ? fsPath
    : path.join(process.cwd(), fsPath);
  const keypairSecret = new Uint8Array(
    JSON.parse(fs.readFileSync(keypairPath, "utf8"))
  );
  return Keypair.fromSecretKey(keypairSecret);
};
