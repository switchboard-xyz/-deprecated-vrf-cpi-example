import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";

export class VrfState {
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

  async loadData(): Promise<any> {
    const state: any = await this.program.account.vrfState.fetch(
      this.publicKey
    );
    state.ebuf = undefined;
    return state;
  }

  async print(): Promise<void> {
    console.log(JSON.stringify(await this.loadData(), undefined, 2));
  }

  public static fromSeed(
    program: anchor.Program,
    vrfPubkey: PublicKey,
    authority: PublicKey
  ): [VrfState, number] {
    const [statePubkey, stateBump] =
      anchor.utils.publicKey.findProgramAddressSync(
        [Buffer.from("STATE"), vrfPubkey.toBytes(), authority.toBytes()],
        program.programId
      );
    return [new VrfState(program, statePubkey), stateBump];
  }

  // public static async create(
  //   program: anchor.Program,
  //   vrfPubkey: PublicKey,
  //   maxResult = 25_000
  // ): Promise<VrfState> {
  //   const payerKeypair = Keypair.fromSecretKey(
  //     (program.provider.wallet as any).payer.secretKey
  //   );
  //   const [stateAccount, stateBump] = VrfState.fromSeed(
  //     program,
  //     payerKeypair.publicKey
  //   );
  //   const state = new VrfState(program, stateAccount.publicKey);
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
  //         vrfAccount: vrfPubkey,
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
