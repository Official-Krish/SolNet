const BASE_PRICE_SOL = 0.0005;
const CPU_PRICE_PER_CORE_SOL = 0.0001;
const RAM_PRICE_PER_GB_SOL = 0.0002;
const DISK_PRICE_PER_GB_SOL = 0.00005;
const FREE_CPU_CORES = 2;
const FREE_RAM_GB = 1;
const FREE_DISK_GB = 10;
const MAX_PRICE_SOL = 0.05;

export const calculatePricePerHour = (
  cpuCores: number,
  ramGb: number,
  diskGb: number,
): number => {
  let price = BASE_PRICE_SOL;
  if (cpuCores > FREE_CPU_CORES) {
    price += (cpuCores - FREE_CPU_CORES) * CPU_PRICE_PER_CORE_SOL;
  }
  if (ramGb > FREE_RAM_GB) {
    price += (ramGb - FREE_RAM_GB) * RAM_PRICE_PER_GB_SOL;
  }
  if (diskGb > FREE_DISK_GB) {
    price += (diskGb - FREE_DISK_GB) * DISK_PRICE_PER_GB_SOL;
  }
  if (price > MAX_PRICE_SOL) {
    price = MAX_PRICE_SOL;
  }
  return price;
};
