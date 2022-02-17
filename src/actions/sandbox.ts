import {
  loadKeypair,
  loadSwitchboardProgram,
  loadVrfExampleProgram,
} from "../utils";

/** Sandbox command to add your own functionality */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function Sandbox(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl } = argv;
  const payerKeypair = loadKeypair(payer);

  const exampleProgram = await loadVrfExampleProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );
  const program = await loadSwitchboardProgram(payerKeypair, cluster, rpcUrl);

  console.log("Not implemented");
}
