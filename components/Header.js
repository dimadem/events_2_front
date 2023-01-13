import { useState, useEffect } from "react";
import walletProvider from "./walletProvider";
import abi from "../abi/Events2front.json";
import { ethers } from "ethers";

const Header = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [haveWallet, setHaveWallet] = useState(false);
  const [cntr, setCntr] = useState("");
  const [balance, setBalance] = useState(0);
  const [txConfirmed, setTxConfirmed] = useState("");
  const [logs, setLogs] = useState([]);
  const [logsOptions, setLogsOptions] = useState(
    "Contribute(address,address,uint256)"
  );

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

  function setOptions(e) {
    setLogsOptions(e.target.value);
  }

  useEffect(() => {
    console.log(logsOptions);
  }, [logsOptions]);

  useEffect(() => {
    // Проверка наличия кошелька
    var hv = typeof window !== "undefined" && window?.ethereum; //! крутой прием
    setHaveWallet(hv);

    // Подписка на события
    if (hv) {

      //здесь слушаются события
      const filter = {
        address: contractAddress,
        topics: [
          ethers.utils.id("WithdrawMoney(address,uint256)")
        ],
        fromBlock: 0,
        toBlock: "latest"
      }
      walletProvider.on(filter, (log, event) => {
        console.log('new Withdraw event!', log)
      })


      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      return () => {
        walletProvider.removeAllListeners();//здесь сбрасываюется листенер
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
  const contribute = async () => {
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
        var tx = await contract.contribute(options);

        // подтверждение транзакции
        // способ1
        //const txc = await walletProvider.waitForTransaction(tx.hash)
        //setTxConfirmed(txc.blockNumber);
        // способ 2
        walletProvider.once(tx.hash, (txc) => {
          setTxConfirmed("tx completed! "+ txc.blockNumber)
        })

      }
    } catch (error) {
      console.error(error);
    }
  };

  // Логи
  const getLogs = async () => {
    console.log(`Getting events...`);

    // что это
    // const contribute = "Contribute(address,address,uint256)";
    // const largestContributor = "NewLargestContributor(address,uint256)";
    // const withDrawMoney = "WithdrawMoney(address,uint)";
    // const eventTopic = ethers.utils.id(contribute); // Get the data hex string
    // хеширует события

    //const contribute = ethers.utils.id("Contribute(address,address,uint256)");
    //// const contribute = ethers.utils.id(abi.abi.contribute);
    //const withDrawMoney = ethers.utils.id("WithdrawMoney(address,uint256)"); //todo abi.encode посмотреть про функцию и попробовать добавить abi;
    //const largestContributor = ethers.utils.id(
    //  "NewLargestContributor(address,uint256)"
    //);

    // let events = await cryptopunkContract.queryFilter('PunkTransfer', currentBlock - 10000, currentBlock);

    // const transferEvent = new ethers.utils.Interface([
    //   "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    // ]);

    const intrfc = new ethers.utils.Interface(abi.abi);

    const rawLogs = await walletProvider.getLogs({
      address: contractAddress,
      // topics: [(ethers.utils.id(logsOptions))],
      //topics: [ethers.utils.id("WithdrawMoney(address,uint256)")],

      //так можно фильтровать несколько событий
      topics: [[
        // ethers.utils.id("Contribute(address,address,uint256)"),
        // ethers.utils.id("NewLargestContributor(address,uint256)"),
        // ethers.utils.id("WithdrawMoney(address,uint256)"),
        intrfc.getEventTopic("Contribute"),
        intrfc.getEventTopic("NewLargestContributor"),
        intrfc.getEventTopic("NewLargestContributor")
      ]],
      fromBlock: 0,
      toBlock: "latest",
    });

    console.log(`Parsing events...`);

    setLogs(rawLogs);
    console.log("rawLogs:", rawLogs);

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


  // Логи
  const searchLogs = async () => {
    console.log(`Getting events...`);

    // что это
    // const contribute = "Contribute(address,address,uint256)";
    // const largestContributor = "NewLargestContributor(address,uint256)";
    // const withDrawMoney = "WithdrawMoney(address,uint)";
    // const eventTopic = ethers.utils.id(contribute); // Get the data hex string
    // хеширует события

    //const contribute = ethers.utils.id("Contribute(address,address,uint256)");
    //// const contribute = ethers.utils.id(abi.abi.contribute);
    //const withDrawMoney = ethers.utils.id("WithdrawMoney(address,uint256)"); //todo abi.encode посмотреть про функцию и попробовать добавить abi;
    //const largestContributor = ethers.utils.id(
    //  "NewLargestContributor(address,uint256)"
    //);

    var indexed = ethers.utils.hexZeroPad("0x6c93589a905Ec991a4987b727D32191feD1C60a3", 32);

    const rawLogs = await walletProvider.getLogs({
      address: contractAddress,
      topics: [ethers.utils.id("Contribute(address,address,uint256)"), indexed],
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
      console.log(parsedLog);
      console.log("************************************************");
    });
  };



  // if (!haveWallet) return <p>no Wallet</p>;

  return (
    <>
      <div className="flex flex-row justify-end p-2">
        <div className="flex flex-col rounded-md bg-opacity-40 w-1/3">
          <p className="text-xl p-2 text-zinc-700"> 👛 {currentAccount}</p>
          {currentAccount ? (
            <button
              className="p-2 text-8xl text-right"
              onClick={() => {
                setCurrentAccount("");
              }}
            >
              💸
            </button>
          ) : (
            <button
              className="p-2 text-8xl text-right"
              onClick={handleMetamaskConnect}
            >
              🤑
            </button>
          )}
        </div>
      </div>


      {currentAccount && (
        <div className="flex flex-row p-2">
          <p className="p-2 text-8xl text-right">⚒</p>
          <div>
            <button onClick={searchLogs}>Search logs</button>
          </div>
        </div>
      )}

      <div className="flex flex-row p-2">
        <p className="p-2 text-8xl text-right">⚖️</p>
        {currentAccount && (
          <>
            <div>
              <p>{balance}</p>
              <button onClick={getBalance}>Get balance</button>
            </div>
            <div>
              <p>Confirmation: {txConfirmed}</p>
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
      {currentAccount && (
        <div className="">
          <select onChange={setOptions}>
            <option value={"Contribute(address,address,uint256)"}>
              Contributor
            </option>
            <option value={"NewLargestContributor(address,uint256)"}>
              Highest_Contributor
            </option>
            <option value={"WithdrawMoney(address,uint256)"}>
              Withdraw
            </option>
          </select>
        </div>
      )}
      <div className="flex flex-row p-2">
        <p className="p-2 text-8xl text-right">⚒</p>
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
