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

export enum VrfStatus {
  STATUS_NONE = "statusNone",
  STATUS_REQUESTING = "statusRequesting",
  STATUS_VERIFYING = "statusVerifying",
  STATUS_VERIFIED = "statusVerifying",
  STATUS_CALLBACK_SUCCESS = "statusCallbackSuccess",
  STATUS_VERIFY_FAILURE = "statusVerifyFailure",
}

export const toVrfStatus = (
  status: Record<string, unknown>
): VrfStatus | string => {
  if ("statusNone" in status) {
    return VrfStatus.STATUS_NONE;
  }
  if ("statusRequesting" in status) {
    return VrfStatus.STATUS_REQUESTING;
  }
  if ("statusVerifying" in status) {
    return VrfStatus.STATUS_VERIFYING;
  }
  if ("statusVerified" in status) {
    return VrfStatus.STATUS_VERIFIED;
  }
  if ("statusCallbackSuccess" in status) {
    return VrfStatus.STATUS_CALLBACK_SUCCESS;
  }
  if ("statusVerifyFailure" in status) {
    return VrfStatus.STATUS_VERIFY_FAILURE;
  }
  return "Unknown";
};
