import { useState, useEffect, useMemo } from "react";
import abi from "../abi/Events2front.json";
import { ethers } from "ethers";

const DataLayout = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [provider, setProvider] = useState(false);
  const [cntr, setCntr] = useState("");
  const [searchAddress, setSearchAddress] = useState("0x6c93589a905Ec991a4987b727D32191feD1C60a3");
  const [balance, setBalance] = useState(0);
  const [logs, setLogs] = useState([[], null]);
  const [logsOptions, setLogsOptions] = useState("");
  const [messages, setMessages] = useState("");

  // создать интерфейс с аби
  const intrfc = new ethers.utils.Interface(abi.abi);

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

  useEffect(() => {
    // Проверка наличия кошелька
    var hv = typeof window !== "undefined" && window?.ethereum; //! крутой прием
    //setHaveWallet(hv);

    // Подписка на события
    if (hv) {
      //должна инициализироваться сразу, но это возможно при наличии метамаска
      const walletPprovider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(walletPprovider);

      //здесь слушается WithdrawMoney
      const filter = {
        address: contractAddress,
        topics: [intrfc.getEventTopic("WithdrawMoney")],
        fromBlock: 0,
        toBlock: "latest"
      }
      walletPprovider.on(filter, (log, event) => {
        console.log('new Withdraw event!', log)//todo сделать алерт, учесть множественный
      })

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        walletPprovider.removeAllListeners();//здесь сбрасываюется листенер

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

      const accounts = await provider.send("eth_requestAccounts", []);
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
        provider
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
  const contribute = async () => {
    event.preventDefault();
    try {
      // контракт
      const contract = new ethers.Contract(
        contractAddress,
        abi.abi,
        provider.getSigner()
      );
      // заводится значение из {} на данный момент сумма
      if (cntr) {
        const options = { value: ethers.utils.parseEther(cntr) };
        const tx = await contract.contribute(options);

        // подтверждение транзакции
        //const txc = await walletProvider.waitForTransaction(tx.hash)
        provider.once(tx.hash, (txc) => {
          setMessages("contribute completed! blockNumber:" + txc.blockNumber);
        })

        setCntr("");
      }
    } catch (error) {
      console.error(error);
    }
  };


  //проверка транзакции через Estimate gas price
  const tryWithdraw = async () => {
    try {
      // контракт
      const contract = new ethers.Contract(
        contractAddress,
        abi.abi,
        provider.getSigner()
      );

      //const estimation = await contract.estimateGas.withdrawMoneyTo("0x0000000000000000000000000000000000000000");
      const estimation = await contract.callStatic.withdrawMoneyTo("0x0000000000000000000000000000000000000000");

      let gasPrice = await provider.getGasPrice()
      let gasLimit = await contract.estimateGas.withdrawMoneyTo("0x0000000000000000000000000000000000000000");


      let transactionFee = gasPrice * gasLimit;

      setMessages("Gas amount: " + transactionFee);
      console.log("Check transaction:", transactionFee);

    } catch (error) {
      console.error(error);
    }
  };

  // Вывод денег
  const withdraw = async () => {
    try {
      // контракт
      const contract = new ethers.Contract(
        contractAddress,
        abi.abi,
        provider.getSigner()
      );
      await contract.withdrawMoneyTo(currentAccount);

      provider.once(tx.hash, (txc) => {
        setMessages("withdraw completed! blockNumber:" + txc.blockNumber);
      })

    } catch (error) {
      console.error(error);
    }
  };

  // Логи
  const getLogs = async () => {
    event.preventDefault();

    if (!logsOptions)//если не выбран элемент списка
      return;

    let topic = [intrfc.getEventTopic(logsOptions)];

    //поиск по индексированному значению
    if (logsOptions == "Contribute" && searchAddress)
      topic[1] = ethers.utils.hexZeroPad(searchAddress, 32);

    const rawLogs = await provider.getLogs({
      address: contractAddress,
      //topics: [ethers.utils.id(logsOptions)],//Contribute(address,address,uint256)
      topics: topic,
      fromBlock: 0,
      toBlock: "latest",
    });
    // console.log("rawLogs:", rawLogs);
    setLogs([rawLogs, logsOptions]);

    // console.log(`Parsing events...`);

    // rawLogs.forEach((log) => {
    //   // console.log(`BEFORE PARSING:`);
    //   // console.debug(log);
    //   // console.log(`\n`);

    //   console.log(`AFTER PARSING:`);
    //   const parsedLog = intrfc.parseLog(log);
    //   // parsing log
    //   console.log("Address:", parsedLog.args[0]);
    //   if (logsOptions == "Contribute(address,address,uint256)") {
    //     console.log("BigNumber:", ethers.utils.formatEther(parsedLog?.args[2]));
    //   } else {
    //     console.log("BigNumber:", ethers.utils.formatEther(parsedLog?.args[1]));
    //   }
    //   console.log("Header:", parsedLog.name);
    //   console.log("************************************************");
    // });
  };

  // Таблица Логов
  const TableData = () =>
    logs[0].map((log, id) => {
      const parsedLog = intrfc.parseLog(log);
      //console.log("parsedLog:", parsedLog.args);
      return (
        <tr key={id}>
          <td key={id + 1} className="border border-slate-300">
            {parsedLog.args[0]}
          </td>
          {logs[1] == "Contribute" ? (
            <td key={id + 2} className="border border-slate-300">
              {ethers.utils.formatEther(parsedLog.args[2])}
            </td>
          ) : (
            <td key={id + 3} className="border border-slate-300">
              {ethers.utils.formatEther(parsedLog.args[1])}
            </td>
          )}
        </tr>
      );
    });

  // if (!haveWallet) return <p>no Wallet</p>;

  return (
    <>
      {/* show address */}
      <div className="flex flex-row justify-between p-3">
        {currentAccount ? (
          <>
            <div className="justify-start">
              <p className="text-red-400 text-xl p-2">{messages}</p>
            </div>
            <div className="flex flex-row justify-end p-3">

              <p className="text-xl p-2">💸 {currentAccount}</p>
              <button
                onClick={() => {
                  setCurrentAccount("");
                }}
              >
                🟢
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="justify-start">
              <p className="text-red-400 text-xl p-2">{messages}</p>
            </div>
            <div className="flex flex-row justify-end p-3">
              <button
                onClick={handleMetamaskConnect}
              >
                🔴 Sign In
              </button>
            </div>
          </>
        )}
      </div>

      {/* get balance */}
      <div className="flex flex-col items-end p-3">
        <div className="flex flex-row">
          {currentAccount ? (
            <>
              <p className="p-2 text-4xl">{balance}</p>
              <button
                className="text-zinc-200 text-4xl p-2"
                onClick={getBalance}
              >
                ⚖️ Get balance
              </button>
            </>
          ) : (
            <>
              <p className="text-zinc-200 text-4xl p-2">⚖️ Get balance</p>
            </>
          )}
        </div>

        {/* contribute to the contract */}
        <div className="flex flex-row p-3">
          {currentAccount ? (
            <form onSubmit={contribute}>
              <input
                className="text-zinc-400 p-2 mx-4 text-4xl"
                onChange={(e) => setCntr(e.target.value)}
                value={cntr}
                placeholder="Enter amount"
              />
              <button
                className="p-2 text-4xl"
                type="submit"
                onClick={contribute}
              >
                🪙 Contribute money
              </button>
            </form>
          ) : (
            <p className="p-2 text-4xl">🪙 Contribute money</p>
          )}
        </div>

        {/* withdraw money*/}
        <div className="flex flex-row p-3">
          {currentAccount ? (
            <>
              <button
                className="p-2 text-2xl"
                onClick={tryWithdraw}
              >
                ✔ Check gas amount
              </button>
              <button
                className="p-2 text-4xl"
                onClick={withdraw}
              >
                🏆 Withdraw money
              </button>
            </>
          ) : (
            <p className="p-2 text-4xl">🏆 Withdraw money</p>
          )}
        </div>

        {/* setLogs */}
        <div className="flex flex-row justify-end p-3">
          {currentAccount ? (
            <>

              <form onSubmit={getLogs}>
                <input
                  className="text-zinc-400 p-2 mx-4 text-4xl"
                  onChange={(e) => setSearchAddress(e.target.value)}
                  value={searchAddress}
                  placeholder="Enter indexed address"
                />
                <select
                  className="text-orange-400 text-lg bg-transparent p-4 border-dashed border-zinc-800"
                  onChange={(e) => setLogsOptions(e.target.value)}
                >
                  <option>-</option>
                  <option value={"Contribute"}>
                    Contributor
                  </option>
                  <option value={"NewLargestContributor"}>
                    Highest Contributor
                  </option>
                  <option value={"WithdrawMoney"}>
                    Withdraw
                  </option>
                </select>
                <button className="p-2 text-4xl text-right" type="submit" onClick={getLogs}>
                  ⚒ Get logs
                </button>
              </form>
            </>
          ) : (
            <p className="p-2 text-4xl">⚒ Get logs</p>
          )}
        </div>
      </div>

      {/* table */}
      <div className="flex flex-col pt-8 p-4">
        {currentAccount ? (
          <table className="table-fixed border-collapse border border-slate-400">
            <thead className="">
              <tr className="my-3 text-xl">
                <th className="border border-slate-300">address</th>
                <th className="border border-slate-300">amount</th>
              </tr>
            </thead>
            <tbody className="text-center text-lg">
              <TableData />
            </tbody>
          </table>
        ) : null}
      </div>
    </>
  );
};

export default DataLayout;
