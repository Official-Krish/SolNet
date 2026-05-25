import { createQueue, redisConnection } from "@decloud/utilities/redis";

export const vmQueue = createQueue("vm-termination");

export const terminateDepinVMQueue = createQueue("terminate-depin-vm");

export const activateHostQueue = createQueue("changeVMStatus");

export { redisConnection as connection };
