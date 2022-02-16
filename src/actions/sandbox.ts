import {
  loadKeypair,
  loadSwitchboardProgram,
  loadVrfExampleProgram,
} from "../utils";

/** Sandbox command to add your own functionality */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function Sandbox(argv: any): Promise<void> {
  const { payer } = argv;
  const payerKeypair = loadKeypair(payer);

  const exampleProgram = loadVrfExampleProgram(payerKeypair);
  const program = await loadSwitchboardProgram(payerKeypair);

  console.log("Not implemented");
}
