import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { VrfClient } from "../types";
import { loadKeypair, loadVrfClientProgram } from "../utils";
dotenv.config();

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function updateProgram(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, stateKey } = argv;
  const payerKeypair = loadKeypair(payer);
  const statePubkey = new PublicKey(stateKey);
  const clientProgram = await loadVrfClientProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );

  const state = new VrfClient(clientProgram, statePubkey);
  const stateData = await state.loadData();

  const signature = await clientProgram.rpc.updateResult(
    {},
    {
      accounts: {
        state: statePubkey,
        vrf: stateData.vrf,
      },
      signers: [payerKeypair],
    }
  );

  console.log(`https://explorer.solana.com/tx/${signature}?cluster=${cluster}`);
  const confirmedTxn = await clientProgram.provider.connection.getTransaction(
    signature
  );
  console.log(JSON.stringify(confirmedTxn?.meta?.logMessages, undefined, 2));

  const ixData = await clientProgram.provider.connection.getParsedTransaction(
    signature
  );
  console.log(JSON.stringify(ixData, undefined, 2));
}
