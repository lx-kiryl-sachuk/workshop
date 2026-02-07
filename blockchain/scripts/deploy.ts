import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Token = await ethers.getContractFactory("WorkshopToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const addr = await token.getAddress();
  console.log("TOKEN_ADDRESS=" + addr);
  console.log("CHAIN_ID=31337");
  console.log("RPC_HTTP=http://127.0.0.1:8545");
  console.log("RPC_WS=ws://127.0.0.1:8545");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
