export interface Machine {
  id: string;
  machineType: string;
  region: string;
  isActive: boolean;
  cpu: number;
  ram: number;
  diskSize: number;
  claimedSOL: number;
  ipAddress: string;
  isOccupied: boolean;
  PerHourPrice: number;
}
