import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const YODA_ADDRESS = "0xbd27d0b7F9fedb5A2A2C3ceF5dC9c70f3CF64Af2";

export default buildModule("BlockTicketsModule", (m) => {
  const blockTickets = m.contract("BlockTickets", [YODA_ADDRESS]);

  return { blockTickets };
});