import { List, Button, Col, Menu, Row, Card, Progress, Spin, Divider, Input } from "antd";

import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
import { Transactor, Web3ModalSetup } from "./helpers";
import { useStaticJsonRPC } from "./hooks";
import SoRadTokenWallet from "./components/SoRadToken/SoRadTokenWallet";
import Vendor from "./components/Vendor/Vendor";
import SoRadIcon from "./components/SoRadToken/SoRadIcon";
import VendorEvents from "./components/Vendor/VendorEvents";
import { useWindowWidth } from "@react-hook/window-size";

import SectionTitle from "./components/CustomKit/SectionTitle";
import { softTextColor, swapGradient } from "./styles";
import CustomAccount from "./components/CustomKit/CustomAccount";
import CustomNetworkDisplay from "./components/CustomKit/CustomNetworkDisplay";
import CustomHeader from "./components/CustomKit/CustomHeader";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const defaultTargetNetwork = NETWORKS.rinkeby; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false;
const NETWORKCHECK = true;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

export const AppContext = createContext({});
export const ThemeContext = createContext({
  theme: "",
  setTheme: () => {},
});
export const LayoutContext = createContext({});
function App(props) {
  const windowWidth = useWindowWidth();

  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = ["localhost", "mainnet", "rinkeby"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const selectedNetworkOption = networkOptions.includes(defaultTargetNetwork.name)
    ? defaultTargetNetwork.name
    : networkOptions[0];
  const [selectedNetwork, setSelectedNetwork] = useState(selectedNetworkOption);
  const location = useLocation();

  /// 📡 What chain are your contracts deployed to?
  const targetNetwork = NETWORKS[selectedNetwork]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  const userTokenBalance = useContractReader(readContracts, "SoRadToken", "balanceOf", [address]);
  console.log("🏵 userTokenBalance:", userTokenBalance ? ethers.utils.formatEther(userTokenBalance) : "...");

  const vendorAddress = readContracts && readContracts.Vendor && readContracts.Vendor.address;
  const tokenAddress = readContracts && readContracts.SoRadToken && readContracts.SoRadToken.address;

  const readyAll = vendorAddress && tokenAddress;

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const appContext = {
    contractConfig,
    readContracts,
    writeContracts,
    userSigner,
    localProvider,
    userAddress: address,
    tx,
    userEthBalance: yourLocalBalance,
    price,
    gasPrice,
    localChainId,
    blockExplorer,
  };

  const layoutContext = {
    windowWidth,
  };

  const [theme, setTheme] = useState(window.localStorage.getItem("theme"));
  const themeContext = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <LayoutContext.Provider value={layoutContext}>
      <ThemeContext.Provider value={themeContext}>
        <AppContext.Provider value={appContext}>
          <div className="App">
            {/* ✏️ Edit the header and change the title to your project name */}
            <BrowserRouter>
              <div
                style={{
                  width: "fit-content",
                  borderRight: "1px solid #efefef",
                  borderBottom: "1px solid #efefef",
                  background: swapGradient,
                }}
              >
                <Link to="/">
                  <CustomHeader />
                </Link>
              </div>
              <Link to="/contracts">
                <Button
                  type="default"
                  style={{
                    position: "absolute",
                    bottom: "2.5rem",
                    right: "0rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0.8,
                    boxShadow: "0 3px 5px 1px #eaeaea",
                    zIndex: 10,
                  }}
                >
                  <div style={{ fontSize: "1rem", color: softTextColor }}>
                    <span style={{ marginRight: "0.75rem", fontSize: "0.875rem" }}>🛠</span>Debug
                  </div>
                </Button>
              </Link>

              <div className="AppScroller">
                <Switch>
                  <Route exact path="/">
                    <div className="AppCenteredCol">
                      <div
                        style={{ padding: "2rem 0 0", display: "flex", flexDirection: "column", alignItems: "center" }}
                      >
                        <div
                          style={{
                            fontSize: "1.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "1rem",
                            margin: "0 0 1rem",
                          }}
                        >
                          <SoRadIcon size={42} /> So Rad Token <SoRadIcon size={42} />
                        </div>
                        {!readyAll && (
                          <div
                            style={{
                              height: "40vh",
                              margin: "auto",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Spin size="large" />
                          </div>
                        )}
                        {readyAll && (
                          <div
                            style={{
                              maxWidth: "57rem",
                              marginTop: "2rem",
                              display: "flex",
                              flexWrap: "wrap",
                              justifyContent: "center",
                              gap: "4rem",
                            }}
                          >
                            <div>
                              <SoRadTokenWallet
                                tokenBalance={userTokenBalance}
                                mainnetProvider={mainnetProvider}
                                writeContracts={writeContracts}
                                userETHBalance={yourLocalBalance}
                                tx={tx}
                                height={490}
                                tokenAddress={tokenAddress}
                              />
                            </div>

                            <Vendor
                              vendorAddress={vendorAddress}
                              userTokenBalance={userTokenBalance}
                              readContracts={readContracts}
                              writeContracts={writeContracts}
                              contractConfig={contractConfig}
                              localProvider={localProvider}
                              mainnetProvider={mainnetProvider}
                              userSigner={userSigner}
                              price={price}
                              gasPrice={gasPrice}
                              tx={tx}
                              DEBUG={DEBUG}
                              userAddress={address}
                              userEthBalance={yourLocalBalance}
                              height={490}
                            />
                            <Divider style={{ marginBottom: "0" }}>
                              <SectionTitle text="Vendor Events" />
                            </Divider>
                            <VendorEvents
                              readContracts={readContracts}
                              localProvider={localProvider}
                              mainnetProvider={mainnetProvider}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Route>

                  <Route exact path="/debug">
                    <div className="AppCenteredCol">
                      <Contract
                        name="Vendor"
                        signer={userSigner}
                        provider={localProvider}
                        address={address}
                        blockExplorer={blockExplorer}
                        contractConfig={contractConfig}
                      />

                      <Contract
                        name="SoRadToken"
                        signer={userSigner}
                        provider={localProvider}
                        address={address}
                        blockExplorer={blockExplorer}
                        contractConfig={contractConfig}
                      />
                    </div>
                  </Route>
                </Switch>
              </div>
            </BrowserRouter>

            <ThemeSwitch />

            {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
            <div
              style={{
                position: "fixed",
                textAlign: "right",
                right: 0,
                top: 0,
                padding: "0.5rem 1rem",

                height: 55,
              }}
              className="hud hudTop"
            >
              <div style={{ display: "flex", flex: 1, gap: "1rem", alignItems: "center" }}>
                <div>
                  <NetworkSwitch
                    networkOptions={networkOptions}
                    selectedNetwork={selectedNetwork}
                    setSelectedNetwork={setSelectedNetwork}
                  />
                </div>
                <CustomAccount
                  address={address}
                  localProvider={localProvider}
                  userSigner={userSigner}
                  mainnetProvider={mainnetProvider}
                  price={price}
                  web3Modal={web3Modal}
                  loadWeb3Modal={loadWeb3Modal}
                  logoutOfWeb3Modal={logoutOfWeb3Modal}
                  blockExplorer={blockExplorer}
                  connectedNetworkDisplay={
                    injectedProvider && (
                      <CustomNetworkDisplay
                        NETWORKCHECK={NETWORKCHECK}
                        localChainId={localChainId}
                        selectedChainId={selectedChainId}
                        targetNetwork={targetNetwork}
                        logoutOfWeb3Modal={logoutOfWeb3Modal}
                      />
                    )
                  }
                />
              </div>
              <div style={{ position: "absolute", right: "6.4rem" }}>
                {userSigner && (
                  <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
                )}
              </div>
            </div>

            {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
            <div
              style={{
                position: "fixed",
                textAlign: "left",
                left: 0,
                bottom: 20,
                padding: 10,
              }}
              className="hud hudBottom"
            >
              <Row align="middle" gutter={[4, 4]}>
                <Col span={8}>
                  <Ramp price={price} address={address} networks={NETWORKS} />
                </Col>

                <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
                  <GasGauge gasPrice={gasPrice} />
                </Col>
                <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
                  <Button
                    onClick={() => {
                      window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
                    }}
                    size="large"
                    shape="round"
                  >
                    <span style={{ marginRight: 8 }} role="img" aria-label="support">
                      💬
                    </span>
                    Support
                  </Button>
                </Col>
              </Row>

              <Row align="middle" gutter={[4, 4]}>
                <Col span={24}>
                  {
                    /*  if the local provider has a signer, let's show the faucet:  */
                    faucetAvailable ? (
                      <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
                    ) : (
                      ""
                    )
                  }
                </Col>
              </Row>
            </div>
          </div>
        </AppContext.Provider>
      </ThemeContext.Provider>
    </LayoutContext.Provider>
  );
}

export default App;
