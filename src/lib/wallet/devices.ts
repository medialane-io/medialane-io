import { computeOwnerGuid, type GuardianInfo } from "@medialane/sdk/starknet";

export interface DeviceEntry {
  guid: string;
  type: GuardianInfo["type"];
  isThisDevice: boolean;
}

export function describeDevices(owners: GuardianInfo[], thisDevicePubkey: string): DeviceEntry[] {
  const mine = computeOwnerGuid(thisDevicePubkey);
  return owners.map((o) => ({
    guid: o.guid,
    type: o.type,
    isThisDevice: BigInt(o.guid) === BigInt(mine),
  }));
}

export function canRemoveDevice(devices: DeviceEntry[], guid: string): boolean {
  if (devices.length <= 1) return false;
  return devices.some((d) => BigInt(d.guid) === BigInt(guid));
}
