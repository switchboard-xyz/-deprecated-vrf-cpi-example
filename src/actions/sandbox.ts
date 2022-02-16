import * as spl from "@solana/spl-token";
import { PublicKey, SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from "@solana/web3.js";
import {
  OracleQueueAccount,
  PermissionAccount,
  ProgramStateAccount,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2";
import {
  loadKeypair,
  loadSwitchboardProgram,
  loadVrfExampleProgram,
} from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function Sandbox(argv: any): Promise<void> {
  const { payer, vrfKey } = argv;
  const vrfPubkey = new PublicKey(vrfKey);

  const payerKeypair = loadKeypair(payer);
  const exampleProgram = loadVrfExampleProgram(payerKeypair);
  const program = await loadSwitchboardProgram(payerKeypair);

  const vrfAccount = new VrfAccount({
    program,
    publicKey: vrfPubkey,
  });

  const vrf = await vrfAccount.loadData();
  const queueAccount = new OracleQueueAccount({
    program,
    publicKey: vrf.oracleQueue,
  });
  const queue = await queueAccount.loadData();
  const queueAuthority = queue.authority;
  const dataBuffer = queue.dataBuffer;
  const escrow = vrf.escrow;
  const [programStateAccount, programStateBump] =
    ProgramStateAccount.fromSeed(program);
  const [permissionAccount, permissionBump] = PermissionAccount.fromSeed(
    program,
    queueAuthority,
    queueAccount.publicKey,
    vrfPubkey
  );
  try {
    await permissionAccount.loadData();
  } catch {
    throw new Error(
      "A requested permission pda account has not been initialized."
    );
  }
  const switchTokenMint = await programStateAccount.getTokenMint();
  const payerTokenAccount =
    await switchTokenMint.getOrCreateAssociatedAccountInfo(
      payerKeypair.publicKey
    );
  const tokenProgram = spl.TOKEN_PROGRAM_ID;
  const recentBlockhashes = SYSVAR_RECENT_BLOCKHASHES_PUBKEY;
  console.log(
    `Sending Txn\nstateBump: ${programStateBump}\npermissionBump: ${permissionBump}`
  );
  const requestTxn = await exampleProgram.rpc.requestResult(
    {
      stateBump: programStateBump,
      permissionBump,
    },
    {
      accounts: {
        switchboardProgram: program.programId,
        authority: vrf.authority,
        vrf: vrfPubkey,
        oracleQueue: queueAccount.publicKey,
        queueAuthority,
        dataBuffer,
        permission: permissionAccount.publicKey,
        escrow,
        payerWallet: payerTokenAccount.address,
        payerAuthority: payerKeypair.publicKey,
        recentBlockhashes,
        programState: programStateAccount.publicKey,
        tokenProgram,
      },
      signers: [payerKeypair, payerKeypair],
    }
  );
  console.log(`https://solscan.io/tx/${requestTxn}?cluster=devnet`);
}
