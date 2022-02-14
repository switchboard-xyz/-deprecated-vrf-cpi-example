import { SwitchboardPermissionValue } from "@switchboard-xyz/switchboard-v2";

export const toPermissionString = (
  permission: SwitchboardPermissionValue
): string => {
  switch (permission) {
    case SwitchboardPermissionValue.PERMIT_ORACLE_HEARTBEAT:
      return "PERMIT_ORACLE_HEARTBEAT";
    case SwitchboardPermissionValue.PERMIT_ORACLE_QUEUE_USAGE:
      return "PERMIT_ORACLE_QUEUE_USAGE";
    default:
      return "NONE";
  }
};
