import { useState, useEffect } from "react";
import walletProvider from "./walletProvider";

import abi from "../abi/Events2front.json";
import { ethers } from "ethers";

const Header = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [haveWallet, setHaveWallet] = useState(false);
  const [cntr, setCntr] = useState("");
  const [balance, setBalance] = useState(0);

  // Смена аккаунта
  function handleAccountsChanged(accounts) {
    console.log("Accounts", accounts);
    setCurrentAccount(accounts[0]);
  }

  // Смена сети
  function handleChainChanged(chainId) {
    if (chainId !== "0x5") {
      setCurrentAccount("");
    }
  }

  useEffect(() => {
    // Проверка наличия кошелька
    var hv = typeof window !== "undefined" && window?.ethereum; //! крутой прием
    setHaveWallet(hv);

    // Подписка на события
    if (hv) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Подключение к метамаску
  const handleMetamaskConnect = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x5" }],
      });

      const accounts = await walletProvider.send("eth_requestAccounts", []);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  // Адресс контракта в сети
  const contractAddress = "0x7876A574E6FaA409514c30dc2d8DA732254c9af6";

  // Запрос баланса
  const getBalance = async () => {
    try {
      // контракт
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        walletProvider
      );
      //? запрос баланса
      const contractBalance = await contract.getBalance();
      // const contractBalance = await walletProvider.getBalance(contractAddress);
      //? запрос баланса
      const contractBalanceEthers = ethers.utils.formatEther(contractBalance);

      // сохранение баланса в стейт
      setBalance(contractBalanceEthers);

      console.log("Account balance:", contractBalanceEthers);
    } catch (error) {
      console.error(error);
    }
  };

  // Пополнение баланса
  const contribute = async () => {
    event.preventDefault();
    try {
      // контракт
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        walletProvider.getSigner()
      );
      //? параметры чего?
      const options = { value: ethers.utils.parseEther(cntr) };
      await contract.contribute(options);
    } catch (error) {
      console.error(error);
    }
  };

  // Логи
  const getLogs = async () => {
    console.log(`Getting events...`);

    // const eventSignature = 'WithdrawMoney(address,uint)';
    //? что это
    const eventSignature = "Contribute(address,address,uint256)";
    const eventTopic = ethers.utils.id(eventSignature); // Get the data hex string

    const rawLogs = await walletProvider.getLogs({
      address: contractAddress,
      topics: [eventTopic],
      fromBlock: 0,
      toBlock: "latest",
    });

    console.log(`Parsing events...`);
    const intrfc = new ethers.utils.Interface(abi);

    rawLogs.forEach((log) => {
      // console.log(`BEFORE PARSING:`);
      // console.debug(log);
      // console.log(`\n`);

      console.log(`AFTER PARSING:`);
      let parsedLog = intrfc.parseLog(log);
      console.log(parsedLog);
      console.log("************************************************");
    });
  };

  if (!haveWallet) return <p>no Wallet</p>;

  return (
    <>
      <div
        style={{
          display: "flex",
          position: "relative",
          justifyContent: "space-between",
          padding: "16px",
        }}
      >
        <h1>Wallet</h1>
        {currentAccount ? (
          <div>
            <h2>{currentAccount}</h2>
            <button
              onClick={() => {
                setCurrentAccount("");
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <button onClick={handleMetamaskConnect}>Connect to metamask</button>
        )}
      </div>
      <div
        style={{
          display: "flex",
          position: "relative",
          justifyContent: "space-between",
          padding: "16px",
        }}
      >
        <h1>Functoins</h1>
        {currentAccount && (
          <>
            <div>
              <p>{balance}</p>
              <button onClick={getBalance}>Get balance</button>
            </div>
            <div>
              <form onSubmit={contribute}>
                <input
                  onChange={(e) => setCntr(e.target.value)}
                  value={cntr}
                  placeholder="Enter amount in eth"
                />
                <button type="submit">Contribute</button>
              </form>
            </div>
          </>
        )}
      </div>
      <div
        style={{
          display: "flex",
          position: "relative",
          justifyContent: "space-between",
          padding: "16px",
        }}
      >
        <h1>Logs</h1>
        {currentAccount && (
          <div>
            <button onClick={getLogs}>Show logs</button>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
