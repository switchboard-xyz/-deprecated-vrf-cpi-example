import { PublicKey } from "@solana/web3.js";
import dotenv from "dotenv";
import { VrfState } from "../types";
import { loadKeypair, loadVrfExampleProgram } from "../utils";
dotenv.config();

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function updateProgram(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, stateKey } = argv;
  const payerKeypair = loadKeypair(payer);
  const statePubkey = new PublicKey(stateKey);
  const exampleProgram = await loadVrfExampleProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );

  const state = new VrfState(exampleProgram, statePubkey);
  const stateData = await state.loadData();

  const signature = await exampleProgram.rpc.updateResult(
    {},
    {
      accounts: {
        state: statePubkey,
        vrfAccount: stateData.vrfAccount,
      },
      signers: [payerKeypair],
    }
  );

  console.log(`https://explorer.solana.com/tx/${signature}?cluster=${cluster}`);
  const confirmedTxn = await exampleProgram.provider.connection.getTransaction(
    signature
  );
  console.log(JSON.stringify(confirmedTxn?.meta?.logMessages, undefined, 2));

  const ixData = await exampleProgram.provider.connection.getParsedTransaction(
    signature
  );
  console.log(JSON.stringify(ixData, undefined, 2));
}
