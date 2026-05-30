-- AlterTable
ALTER TABLE "DepinHostMachine" ADD COLUMN     "lastHeartbeat" TIMESTAMP(3),
ADD COLUMN     "platformFeeEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DepinSettlement" (
    "id" TEXT NOT NULL,
    "hostMachineId" TEXT NOT NULL,
    "renterPubKey" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "hostEarned" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "renterRefund" DOUBLE PRECISION NOT NULL,
    "uptimeSeconds" INTEGER NOT NULL,
    "totalSeconds" INTEGER NOT NULL,
    "txSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepinSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepinSettlement_hostMachineId_idx" ON "DepinSettlement"("hostMachineId");

-- CreateIndex
CREATE INDEX "DepinSettlement_jobId_idx" ON "DepinSettlement"("jobId");

-- AddForeignKey
ALTER TABLE "DepinSettlement" ADD CONSTRAINT "DepinSettlement_hostMachineId_fkey" FOREIGN KEY ("hostMachineId") REFERENCES "DepinHostMachine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
