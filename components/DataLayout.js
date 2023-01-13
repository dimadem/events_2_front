import { useState, useEffect } from "react";
import walletProvider from "./walletProvider";
import abi from "../abi/Events2front.json";
import { ethers } from "ethers";

const DataLayout = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [haveWallet, setHaveWallet] = useState(false);
  const [cntr, setCntr] = useState("");
  const [balance, setBalance] = useState(0);
  const [logs, setLogs] = useState([]);
  const [logsOptions, setLogsOptions] = useState(
    "Contribute(address,address,uint256)"
  );

  // Смена аккаунта
  function handleAccountsChanged(accounts) {
    // console.log("Accounts", accounts);
    setCurrentAccount(accounts[0]);
  }

  // Смена сети
  function handleChainChanged(chainId) {
    if (chainId !== "0x5") {
      setCurrentAccount("");
    }
  }

  function setOptions(e) {
    setLogsOptions(e.target.value);
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
        abi.abi,
        walletProvider
      );
      console.log("Contract:", contract);
      // запрос баланса в 16-ричном формате из контракта
      const contractBalance = await contract.getBalance();

      // берем функцию из контракта как из кошелька
      // const contractBalance = await walletProvider.getBalance(contractAddress);

      // конвертер 0x00000
      const contractBalanceEthers = ethers.utils.formatEther(contractBalance);

      // сохранение баланса в стейт
      setBalance(contractBalanceEthers);

      console.log("Account balance:", contractBalanceEthers);
    } catch (error) {
      console.error(error);
    }
  };

  // Пополнение баланса payable
  const contribute = async (event) => {
    event.preventDefault();
    try {
      // контракт
      const contract = new ethers.Contract(
        contractAddress,
        abi.abi,
        walletProvider.getSigner()
      );
      // заводится значение из {} на данный момент сумма
      if (cntr) {
        const options = { value: ethers.utils.parseEther(cntr) };
        await contract.contribute(options);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Логи
  const getLogs = async () => {
    console.log(`Getting events...`);

    const rawLogs = await walletProvider.getLogs({
      address: contractAddress,
      topics: [ethers.utils.id(logsOptions)],
      fromBlock: 0,
      toBlock: "latest",
    });

    console.log(`Parsing events...`);

    const intrfc = new ethers.utils.Interface(abi.abi);

    setLogs(rawLogs);
    console.log("rawLogs:", rawLogs);

    rawLogs.forEach((log) => {
      // console.log(`BEFORE PARSING:`);
      // console.debug(log);
      // console.log(`\n`);

      console.log(`AFTER PARSING:`);
      let parsedLog = intrfc.parseLog(log);
      // parsing log
      console.log("Address:", parsedLog.args[0]);
      console.log("BigNumber Contributor:", parsedLog.args[2]?._hex);
      console.log("BigNumber Highest&WithdrawMoney:", parsedLog.args[1]?._hex);
      console.log("Header:", parsedLog.name);
      // console.log(parsedLog);
      console.log("************************************************");
    });
  };

  // if (!haveWallet) return <p>no Wallet</p>;

  return (
    <>
      {/* show address */}
      <div className="flex flex-row justify-end p-2">
        <div className="flex flex-col rounded-md bg-opacity-40 w-1/3">
          <p className="text-xl p-2 text-zinc-200">💸 {currentAccount}</p>
          {currentAccount ? (
            <button
              className="p-2 text-5xl text-right"
              onClick={() => {
                setCurrentAccount("");
              }}
            >
              🔴
            </button>
          ) : (
            <button
              className="p-2 text-5xl text-right"
              onClick={handleMetamaskConnect}
            >
              🟢
            </button>
          )}
        </div>
      </div>
      {/* get balance */}
      <div className="flex flex-col items-end p-2">
        <div className="flex flex-row">
          {currentAccount ? (
            <>
              <p className="p-2 text-5xl px-4 text-zinc-200">{balance}</p>
              <button
                className="text-zinc-200 text-5xl p-2"
                onClick={getBalance}
              >
                ⚖️
              </button>
            </>
          ) : (
            <>
              <p className="p-2 text-5xl px-4 text-zinc-400">-</p>
              <p className="text-zinc-200 text-5xl p-2">⚖️</p>
            </>
          )}
        </div>
        {/* contribute to the contract */}
        <div className="flex flex-row">
          {currentAccount ? (
            <form onSubmit={contribute}>
              <input
                className="text-zinc-200 bg-transparent p-2 mx-4 text-4xl"
                onChange={(e) => setCntr(e.target.value)}
                value={cntr}
                placeholder="Enter amount"
              />
              <button
                className="p-2 text-5xl"
                type="submit"
                onClick={() =>
                  setTimeout(() => {
                    setCntr("");
                  }, 1000)
                }
              >
                🪙
              </button>
            </form>
          ) : (
            <p className="p-2 text-5xl">🪙</p>
          )}
        </div>
      </div>

      {/* setLogs */}
      <div className="flex flex-row items-center justify-end p-2">
        {currentAccount ? (
          <>
            <div className="px-4">
              <select
                className="text-zinc-200 text-lg bg-transparent p-4 border-dashed border-zinc-700"
                onChange={setOptions}
              >
                <option value={"Contribute(address,address,uint256)"}>
                  Contributor
                </option>
                <option value={"NewLargestContributor(address,uint256)"}>
                  Highest Contributor
                </option>
                <option value={"WithdrawMoney(address,uint256)"}>
                  Withdraw
                </option>
              </select>
            </div>

            <button className="p-2 text-5xl text-right" onClick={getLogs}>
              ⚒
            </button>
          </>
        ) : (
          <p className="p-2 text-5xl">⚒</p>
        )}
      </div>

      {/* table */}
      <div className="flex flex-col pt-8 p-4">
        <table className="table-fixed border-collapse border border-slate-400">
          <thead className="p-2 text-3xl text-zinc-200">
            <tr>
              <th className="border border-slate-800">address</th>
              <th className="border border-slate-800">money</th>
              <th className="border border-slate-800">Year</th>
            </tr>
          </thead>
          <tbody>
            {/* <tr>
              {rawLogs.map((log) => {
                <td>{log}</td>;
              })}
            </tr> */}
            <tr>
              <td>Witchy Woman</td>
              <td>The Eagles</td>
              <td>1972</td>
            </tr>
            <tr>
              <td>Shining Star</td>
              <td>Earth, Wind, and Fire</td>
              <td>1975</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default DataLayout;
