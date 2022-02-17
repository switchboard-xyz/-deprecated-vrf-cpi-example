import { Cluster, PublicKey } from "@solana/web3.js";
import {
  SBV2_DEVNET_PID,
  SBV2_MAINNET_PID,
  SwitchboardPermissionValue,
} from "@switchboard-xyz/switchboard-v2";

export const toPermissionString = (
  permission: SwitchboardPermissionValue
): string => {
  switch (permission) {
    case SwitchboardPermissionValue.PERMIT_ORACLE_HEARTBEAT:
      return "PERMIT_ORACLE_HEARTBEAT";
    case SwitchboardPermissionValue.PERMIT_ORACLE_QUEUE_USAGE:
      return "PERMIT_ORACLE_QUEUE_USAGE";
    case SwitchboardPermissionValue.PERMIT_VRF_REQUESTS:
      return "PERMIT_VRF_REQUESTS";
    default:
      return "NONE";
  }
};

export const getSwitchboardPid = (cluster: Cluster): PublicKey => {
  if (cluster === "mainnet-beta") {
    return SBV2_MAINNET_PID;
  }
  return SBV2_DEVNET_PID;
};
