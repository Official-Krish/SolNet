import axios from "axios";

export const calculatePrice = async (
  machineType: string,
  diskSize: number,
  duration: number,
): Promise<number> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/vm/calculatePrice`,
      {
        params: {
          machineType,
          diskSize,
        },
        headers: {
          Authorization: `${localStorage.getItem("token")}`,
        },
      },
    );
    const price = response.data.price; // for 30 days
    const perDayPrice = price / 30; // Convert to per day price
    const Inhours = perDayPrice / (24 * 60); // Convert to mins
    return Inhours * duration;
  } catch (error) {
    console.error("Error calculating price:", error);
    return 0;
  }
};

export function getVmDetails(machineType: string): {
  cpu: number;
  ram: number;
} {
  switch (machineType) {
    case "e2-micro":
      return { cpu: 1, ram: 1 };
    case "e2-small":
      return { cpu: 1, ram: 2 };
    case "e2-medium":
      return { cpu: 2, ram: 4 };
    case "e2-standard-2":
      return { cpu: 2, ram: 8 };
    case "e2-standard-4":
      return { cpu: 4, ram: 16 };
    case "e2-highmem-2":
      return { cpu: 2, ram: 16 };
    case "e2-highcpu-2":
      return { cpu: 2, ram: 2 };
    default:
      return { cpu: 0, ram: 0 };
  }
}

export async function calculateEscrowEndTime(
  escrowAmount: number,
  machineType: string,
  diskSize: number,
): Promise<number> {
  const minCost = (await calculatePrice(machineType, diskSize, 1)).toFixed(6);
  return escrowAmount / Number(minCost);
}
