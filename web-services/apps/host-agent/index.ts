#!/usr/bin/env node
import { register } from "./commands/register";
import { start } from "./commands/start";

const command = process.argv[2];

switch (command) {
  case "register":
    register();
    break;
  case "start":
    start();
    break;
  default:
    console.log(`
  Axion Host Agent

  Usage:
    axion register   Register this machine as a DePIN host
    axion start      Start the agent (heartbeat + job execution)
`);
}
