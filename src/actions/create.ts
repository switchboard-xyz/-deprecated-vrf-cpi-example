import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  Callback,
  OracleQueueAccount,
  PermissionAccount,
  SwitchboardPermission,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { VrfClient } from "../types";
import {
  buffer2string,
  loadKeypair,
  loadSwitchboardProgram,
  loadVrfClientProgram,
  toAccountString,
  toPermissionString,
} from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createVrfAccount(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, queueKey, keypair, maxResult } = argv;
  const max = new anchor.BN(maxResult);
  const payerKeypair = loadKeypair(payer);
  const switchboardProgram = await loadSwitchboardProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );
  const vrfclientProgram = await loadVrfClientProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );

  const vrfSecret = keypair
    ? loadKeypair(keypair)
    : anchor.web3.Keypair.generate();

  // create state account but dont send instruction
  // need public key for VRF CPI
  const [stateAccount, stateBump] = VrfClient.fromSeed(
    vrfclientProgram,
    vrfSecret.publicKey,
    payerKeypair.publicKey // client state authority
  );
  try {
    await stateAccount.loadData();
  } catch {}

  console.log(`client bump: ${stateBump}`);

  console.log(chalk.yellow("######## CREATE VRF ACCOUNT ########"));

  const queue = new OracleQueueAccount({
    program: switchboardProgram,
    publicKey: new PublicKey(queueKey),
  });
  const { unpermissionedVrfEnabled, authority } = await queue.loadData();

  const ixCoder = new anchor.BorshInstructionCoder(vrfclientProgram.idl);

  const callback: Callback = {
    programId: vrfclientProgram.programId,
    accounts: [
      // ensure all accounts in updateResult are populated
      { pubkey: stateAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false },
    ],
    ixData: ixCoder.encode("updateResult", ""), // pass any params for instruction here
  };

  console.log(
    toAccountString(
      "Callback",
      JSON.stringify(
        callback,
        (key, value) => {
          if (value instanceof PublicKey) {
            return value.toString();
          }
          if (key === "ixData" || value instanceof Buffer) {
            return buffer2string(value);
          }
          return value;
        },
        2
      )
    )
  );

  const vrfAccount = await VrfAccount.create(switchboardProgram, {
    queue,
    callback,
    authority: stateAccount.publicKey, // vrf authority
    keypair: vrfSecret,
  });
  console.log(toAccountString(`VRF Account`, vrfAccount.publicKey));

  const permissionAccount = await PermissionAccount.create(switchboardProgram, {
    authority: (await queue.loadData()).authority,
    granter: queue.publicKey,
    grantee: vrfAccount.publicKey,
  });
  console.log(toAccountString(`VRF Permission`, permissionAccount.publicKey));

  if (!unpermissionedVrfEnabled) {
    if (!payerKeypair.publicKey.equals(authority)) {
      throw new Error(
        `queue requires PERMIT_VRF_REQUESTS and wrong queue authority provided`
      );
    }
    await permissionAccount.set({
      authority: payerKeypair,
      permission: SwitchboardPermission.PERMIT_VRF_REQUESTS,
      enable: true,
    });
  }
  const permissionData = await permissionAccount.loadData();

  console.log(
    toAccountString(
      `     Permissions`,
      toPermissionString(permissionData.permissions)
    )
  );

  console.log(chalk.yellow("######## INIT PROGRAM STATE ########"));

  await vrfclientProgram.rpc.initState(
    {
      clientStateBump: stateBump,
      maxResult: max,
    },
    {
      accounts: {
        state: stateAccount.publicKey,
        vrf: vrfAccount.publicKey,
        payer: payerKeypair.publicKey,
        authority: payerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [payerKeypair, payerKeypair],
    }
  );
  console.log(toAccountString("Program State", stateAccount.publicKey));
  const state = await stateAccount.loadData();
  const permission = await permissionAccount.loadData();

  console.log(
    `${chalk.blue(
      "Run the following command to watch the Switchboard vrf:"
    )}\n\t${chalk.white(
      "ts-node src watch",
      vrfAccount.publicKey.toString(),
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );
  console.log(
    `${chalk.blue(
      "Run the following command to watch the client program:"
    )}\n\t${chalk.white(
      "ts-node src watch",
      stateAccount.publicKey.toString(),
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );
  console.log(
    `${chalk.blue(
      "Run the following command to request a new ranomness value:"
    )}\n\t${chalk.white(
      "ts-node src request",
      vrfAccount.publicKey.toString(),
      "--payer",
      payer,
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );

  if (!keypair) {
    fs.writeFileSync(
      path.join(
        process.cwd(),
        `./secrets/vrf_account_${vrfSecret.publicKey}-keypair.json`
      ),
      `[${vrfSecret.secretKey}]`
    );
  }

  const outFile = path.join(
    process.cwd(),
    `state_${stateAccount.publicKey}.json`
  );
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        programState: stateAccount.publicKey.toString(),
        maxResult: state.maxResult.toString(),
        vrf: {
          publicKey: vrfAccount.publicKey.toString(),
          authority: state.authority.toString(),
          permissionPubkey: permissionAccount.publicKey.toString(),
          permissions: toPermissionString(permission.permissions),
        },
      },
      undefined,
      2
    )
  );
}
