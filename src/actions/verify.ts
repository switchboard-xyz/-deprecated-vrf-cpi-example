import { PublicKey } from "@solana/web3.js";
import { OracleAccount, VrfAccount } from "@switchboard-xyz/switchboard-v2";
import { loadKeypair, loadSwitchboardProgram } from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function verifyProof(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, vrfKey, all } = argv;
  const payerKeypair = loadKeypair(payer);
  const program = await loadSwitchboardProgram(payerKeypair, cluster, rpcUrl);

  const vrfPubkey = new PublicKey(vrfKey);

  const vrfAccount = new VrfAccount({
    program,
    publicKey: vrfPubkey,
  });
  const vrf = await vrfAccount.loadData();

  if (vrf.builders[0].txRemaining <= 1) {
    console.log(`Proof has already been verified`);
    return;
  }

  const oracleKey = vrf.builders[0].producer;
  const oracleAccount = new OracleAccount({
    program,
    publicKey: oracleKey as PublicKey,
  });

  const sig = await vrfAccount.verify(
    oracleAccount,
    vrf.builders[0].txRemaining
  );

  if (!sig || sig.length === 0) {
    return;
  }

  console.log(JSON.stringify(sig, undefined, 2));

  // console.log(`https://explorer.solana.com/tx/${sig[0]}?cluster=devnet`);
  // const confirmedTxn = await program.provider.connection.getTransaction(
  //   sig[0],
  //   { commitment: "confirmed" }
  // );
  // if (confirmedTxn) {
  //   console.log(JSON.stringify(confirmedTxn, undefined, 2));
  // }
}
