import prisma from "@Axion/db";

async function main() {
  const vmTypes = [
    {
      machineType: "e2-micro",
      cpu: 1,
      ram: 1,
      priceMonthlyUSD: 8.54,
      description:
        "1 vCPU, 1 GB RAM - Ideal for small workloads and testing environments.",
    },
    {
      machineType: "e2-small",
      cpu: 1,
      ram: 2,
      priceMonthlyUSD: 15.89,
      description:
        "1 vCPU, 2 GB RAM - Suitable for lightweight applications and development tasks.",
    },
    {
      machineType: "e2-medium",
      cpu: 2,
      ram: 4,
      priceMonthlyUSD: 30.58,
      description:
        "1 vCPU, 4 GB RAM - Good for moderate workloads and small databases.",
    },
    {
      machineType: "e2-standard-2",
      cpu: 2,
      ram: 8,
      priceMonthlyUSD: 59.95,
      description:
        "2 vCPUs, 8 GB RAM - Balanced performance for web applications and small services.",
    },
    {
      machineType: "e2-standard-4",
      cpu: 4,
      ram: 16,
      priceMonthlyUSD: 118.71,
      description:
        "4 vCPUs, 16 GB RAM - Suitable for larger applications and databases.",
    },
    {
      machineType: "e2-highmem-2",
      cpu: 2,
      ram: 16,
      priceMonthlyUSD: 80.46,
      description:
        "2 vCPUs, 16 GB RAM - Optimized for memory-intensive applications.",
    },
    {
      machineType: "e2-highcpu-2",
      cpu: 2,
      ram: 2,
      priceMonthlyUSD: 44.58,
      description: "2 vCPUs, 2 GB RAM - Optimized for CPU-intensive tasks.",
    },
  ];

  for (const vm of vmTypes) {
    await prisma.vMTypes.create({
      data: {
        machineType: vm.machineType,
        cpu: vm.cpu,
        ram: vm.ram,
        priceMonthlyUSD: vm.priceMonthlyUSD,
        description: vm.description,
      },
    });
  }

  console.log("Seeded VMTypes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
