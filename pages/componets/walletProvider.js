import { ethers } from "ethers";

let walletProvider;

if (typeof window !== "undefined" && window?.ethereum) {
  walletProvider = new ethers.providers.Web3Provider(window.ethereum);
}

// const defaultProvider = new ethers.providers.InfuraProvider("rinkeby");

export default walletProvider;
