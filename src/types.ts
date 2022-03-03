import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export interface VrfClientState {
  authority: PublicKey;
  maxResult: anchor.BN;
  vrf: PublicKey;
  resultBuffer: number[];
  result: anchor.BN;
  lastTimestamp: anchor.BN;
}

export class VrfClient {
  program: anchor.Program;

  publicKey: PublicKey;

  constructor(program: anchor.Program, publicKey: PublicKey) {
    this.program = program;
    this.publicKey = publicKey;
  }

  /**
   * @return account size of the global ProgramStateAccount.
   */
  size(): number {
    return this.program.account.sbState.size;
  }

  async loadData(): Promise<VrfClientState> {
    // console.log(JSON.stringify(this.program.account, undefined, 2));
    const state: any = await this.program.account.vrfClient.fetch(
      this.publicKey
    );
    return state;
  }

  async print(): Promise<void> {
    console.log(JSON.stringify(await this.loadData(), undefined, 2));
  }

  public static fromSeed(
    program: anchor.Program,
    vrfPubkey: PublicKey,
    authority: PublicKey
  ): [VrfClient, number] {
    const [statePubkey, stateBump] =
      anchor.utils.publicKey.findProgramAddressSync(
        [Buffer.from("STATE"), vrfPubkey.toBytes(), authority.toBytes()],
        program.programId
      );
    return [new VrfClient(program, statePubkey), stateBump];
  }

  // public static async create(
  //   program: anchor.Program,
  //   vrfPubkey: PublicKey,
  //   maxResult = 25_000
  // ): Promise<VrfClient> {
  //   const payerKeypair = Keypair.fromSecretKey(
  //     (program.provider.wallet as any).payer.secretKey
  //   );
  //   const [stateAccount, stateBump] = VrfClient.fromSeed(
  //     program,
  //     payerKeypair.publicKey
  //   );
  //   const state = new VrfClient(program, stateAccount.publicKey);
  //   // Short circuit if already created.
  //   try {
  //     await state.loadData();
  //     return state;
  //   } catch {}

  //   await program.rpc.initState(
  //     {
  //       stateBump,
  //       maxResult,
  //     },
  //     {
  //       accounts: {
  //         state: stateAccount.publicKey,
  //         vrf: vrfPubkey,
  //         payer: payerKeypair.publicKey,
  //         authority: payerKeypair.publicKey,
  //         systemProgram: SystemProgram.programId,
  //       },
  //       signers: [payerKeypair],
  //     }
  //   );
  //   return state;
  // }
}
