import React, { useCallback, useMemo } from "react";
import { Button, Card, Descriptions, Divider, Input, List, Spin, Tabs } from "antd";
import { useBalance, useContractLoader, useContractReader } from "eth-hooks";
import { useEffect, useState } from "react";
import { DollarOutlined, LinkOutlined, SwapOutlined } from "@ant-design/icons";

import "./Vendor.css";
import "../Shared/FlexCard.css";
import CustomBalance from "../CustomKit/CustomBalance";
import { errorColor, primaryColor, softTextColor, swapGradient } from "../../styles";
import { exactFloatToFixed } from "../../helpers/numeric";
import SectionTitle from "../CustomKit/SectionTitle";
import SrtEthBalances from "../Shared/SrtEthBalances";

const { TabPane } = Tabs;
const { ethers } = require("ethers");

const Vendor = ({
  vendorAddress,
  userTokenBalance,
  readContracts,
  writeContracts,
  contractConfig,
  localProvider,
  userSigner,
  mainnetProvider,
  price,
  gasPrice,
  tx,
  DEBUG,
  userAddress,
  userEthBalance,
  height,
}) => {
  const vendorETHBalance = useBalance(localProvider, vendorAddress);
  if (DEBUG) console.log("💵 vendorETHBalance", vendorETHBalance ? ethers.utils.formatEther(vendorETHBalance) : "...");

  const vendorApproval = useContractReader(readContracts, "SoRadToken", "allowance", [userAddress, vendorAddress]);
  console.log("🤏 vendorApproval", vendorApproval);

  const vendorTokenBalance = useContractReader(readContracts, "SoRadToken", "balanceOf", [vendorAddress]);
  console.log("🏵 vendorTokenBalance:", vendorTokenBalance ? ethers.utils.formatEther(vendorTokenBalance) : "...");

  const tokensPerEth = useContractReader(readContracts, "Vendor", "tokensPerEth");
  console.log("🏦 tokensPerEth:", tokensPerEth ? tokensPerEth.toString() : "...");

  // ========== DERIVED & OWN STATE =========== //

  const [tokenBuyAmount, setTokenBuyAmount] = useState();
  const [ethCostToPurchaseTokens, setEthCostToPurchaseTokens] = useState();
  const [tokenBuyAmountError, setTokenBuyAmountError] = useState();
  const [tokenSellAmount, setTokenSellAmount] = useState();
  const [ethValueToSellTokens, setEthValueToSellTokens] = useState();
  const [tokenSellAmountError, setTokenSellAmountError] = useState();
  const [isSellAmountApproved, setIsSellAmountApproved] = useState();
  console.log("ethValueToSell: ", ethValueToSellTokens);

  useEffect(() => {
    if (!tokenSellAmount) {
      setIsSellAmountApproved(false);
      return;
    }

    console.log("tokenSellAmount", tokenSellAmount);
    const tokenSellAmountBN = tokenSellAmount && ethers.utils.parseEther("" + tokenSellAmount);
    console.log("tokenSellAmountBN", tokenSellAmountBN);
    setIsSellAmountApproved(vendorApproval && tokenSellAmount && vendorApproval.gte(tokenSellAmountBN));
  }, [tokenSellAmount, readContracts, vendorApproval]);
  console.log("isSellAmountApproved", isSellAmountApproved);

  const [buying, setBuying] = useState();
  const [selling, setSelling] = useState();

  const hasValidSellAmount = ethValueToSellTokens && ethValueToSellTokens.gt("0");
  const hasValidBuyAmount = ethCostToPurchaseTokens && ethCostToPurchaseTokens.gt("0");

  const contracts = useContractLoader(localProvider, contractConfig);

  const vendor = useMemo(() => {
    const { Vendor } = contracts;
    return Vendor && new ethers.Contract(Vendor.address, Vendor.interface, localProvider);
  }, [contractConfig, localProvider, contracts]);

  const [gasEstimateBuy, setGasEstimateBuy] = useState();
  const maxTokenBuyable =
    userEthBalance && tokensPerEth && gasEstimateBuy && userEthBalance.mul(tokensPerEth).sub(gasEstimateBuy);

  useEffect(() => {
    if (!vendor || !gasPrice) return;
    const getEst = async () => {
      let est;
      try {
        est = await vendor.connect(userSigner).estimateGas.buyTokens({ value: ethCostToPurchaseTokens });
        console.log("estimated gas: ", est.toString());
      } catch (e) {
        console.log("failed gas estimation");
        est = "0";
      }
      const gasCostEstimate = ethers.BigNumber.from(gasPrice).mul(est);
      setGasEstimateBuy(gasCostEstimate);
      console.log("estimated gas cost: ", ethers.utils.formatEther(gasCostEstimate.toString()).toString());
    };
    getEst();
  }, [ethCostToPurchaseTokens, gasPrice, vendor]);

  // HACKY HACKY UPDATE

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const readyAll =
    vendorETHBalance &&
    vendorApproval &&
    vendorTokenBalance &&
    userTokenBalance &&
    tokensPerEth &&
    userEthBalance &&
    maxTokenBuyable;

  // =========== PIECES =========== //

  const updateBuyInput = e => {
    let ethCost;
    // NUMERIC VALIDITY
    const buyAmount = e.target.value;
    if (buyAmount.length > 22) return;
    const buyAmountNum = +buyAmount; // maybe NaN
    ethCost = buyAmountNum && tokensPerEth && ethers.utils.parseEther("" + buyAmountNum / parseFloat(tokensPerEth));
    if (isNaN(ethCost)) {
      return;
    }
    setTokenBuyAmount(buyAmount);
    // VALUE VALIDITY
    if (ethCost === 0) {
      setEthCostToPurchaseTokens(null);
      return;
    }
    if (ethCost.lt("0")) {
      setTokenBuyAmountError("Invalid Input");
      setEthCostToPurchaseTokens(null);
      return;
    }
    if (ethCost.gt(userEthBalance)) {
      setTokenBuyAmountError("You have insufficient ETH");
      setEthCostToPurchaseTokens(null);
      return;
    }
    if (ethers.utils.parseEther(buyAmount).gt(vendorTokenBalance)) {
      setTokenBuyAmountError("Vendor has insufficient SRT");
      setEthCostToPurchaseTokens(null);
      return;
    }
    setEthCostToPurchaseTokens(ethCost);
    setTokenBuyAmountError(null);
  };

  const applyMaxTokenBuy = () => {
    const buyAmount = exactFloatToFixed(ethers.utils.formatEther(maxTokenBuyable), 2);
    const buyAmountNum = +buyAmount;
    setTokenBuyAmount(buyAmount);
    const ethCost =
      buyAmountNum && tokensPerEth && ethers.utils.parseEther("" + buyAmountNum / parseFloat(tokensPerEth));
    setEthCostToPurchaseTokens(ethCost);
    setTokenBuyAmountError(null);
  };

  const updateSellInput = e => {
    let ethValue;
    // NUMERIC VALIDITY
    const sellAmount = e.target.value;
    if (sellAmount.length > 22) return;
    const sellAmountNum = +sellAmount;
    ethValue = sellAmountNum && tokensPerEth && ethers.utils.parseEther("" + sellAmountNum / parseFloat(tokensPerEth));

    if (isNaN(ethValue)) {
      return;
    }
    setTokenSellAmount(sellAmount);
    // VALUE VALIDITY
    if (ethValue === 0) {
      setEthValueToSellTokens(null);
      return;
    }
    if (ethValue.lt("0")) {
      setTokenSellAmountError("Invalid Input");
      setEthValueToSellTokens(null);
      return;
    }
    if (ethers.utils.parseEther(sellAmount).gt(userTokenBalance)) {
      setTokenSellAmountError("You have insufficient SRT");
      setEthValueToSellTokens(null);
      return;
    }
    if (ethValue.gt(vendorETHBalance)) {
      setTokenSellAmountError("Vendor has insufficient ETH");
      setEthValueToSellTokens(null);
      return;
    }
    setEthValueToSellTokens(ethValue);
    setTokenSellAmountError(null);
  };

  const applyMaxTokenSell = () => {
    const sellAmount = exactFloatToFixed(ethers.utils.formatEther(userTokenBalance), 2);
    const sellAmountNum = +sellAmount;
    setTokenSellAmount(sellAmount);
    const ethValue =
      sellAmountNum && tokensPerEth && ethers.utils.parseEther("" + sellAmountNum / parseFloat(tokensPerEth));
    setEthValueToSellTokens(ethValue);
    setTokenSellAmountError(null);
  };

  const buyPaneContent = (
    <>
      <Input
        size="large"
        style={{ textAlign: "left" }}
        prefix={<span style={{ marginRight: "0.5rem" }}>SRT</span>}
        suffix={
          <span style={{ color: softTextColor, marginRight: "0.5rem", cursor: "pointer" }} onClick={applyMaxTokenBuy}>
            max{" "}
            <CustomBalance noClick etherMode={false} customSymbol="" size={16} padding={0} balance={maxTokenBuyable} />
          </span>
        }
        value={tokenBuyAmount}
        onChange={updateBuyInput}
        onPaste={e => e.preventDefault()}
      />
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        {hasValidBuyAmount && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ color: softTextColor, fontSize: "1rem", display: "flex" }}>You pay</div>{" "}
            <CustomBalance etherMode balance={ethCostToPurchaseTokens} dollarMultiplier={price} size={16} padding={0} />{" "}
          </div>
        )}
        {tokenBuyAmountError && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ color: errorColor }}>{tokenBuyAmountError}</div>
          </div>
        )}
        <Button
          style={{ alignSelf: "flex-end", width: "9rem", marginLeft: "auto", marginTop: "0.5rem" }}
          type={"primary"}
          size="large"
          disabled={!hasValidBuyAmount}
          loading={buying}
          onClick={async () => {
            setBuying(true);

            await tx(writeContracts.Vendor.buyTokens({ value: ethCostToPurchaseTokens }), update => {
              if (update && (update.error || update.reason)) {
                setBuying(false);
              }
              if (update && (update.status === "confirmed" || update.status === 1)) {
                setBuying(false);
                setTokenBuyAmount("");
                setEthCostToPurchaseTokens(null);
                forceUpdate();
              }
              if (update && update.code) {
                // metamask error etc.
                setBuying(false);
              }
            });

            // use this instead of the updates above if the updates are unreliable
            // setBuying(false);
            // setTokenBuyAmount("");
            // setEthCostToPurchaseTokens(null);
            // forceUpdate();
          }}
        >
          Buy SRT
        </Button>
      </div>
    </>
  );

  const sellPaneContent = (
    <>
      <Input
        size="large"
        style={{ textAlign: "left" }}
        prefix={<span style={{ marginRight: "0.5rem" }}>SRT</span>}
        suffix={
          <span style={{ color: softTextColor, marginRight: "0.5rem", cursor: "pointer" }} onClick={applyMaxTokenSell}>
            max{" "}
            <CustomBalance noClick etherMode={false} customSymbol="" size={16} padding={0} balance={userTokenBalance} />
          </span>
        }
        value={tokenSellAmount}
        onChange={updateSellInput}
      />
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        {hasValidSellAmount && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ color: softTextColor, fontSize: "1rem", display: "flex" }}>You receive</div>
            <CustomBalance etherMode balance={ethValueToSellTokens} dollarMultiplier={price} size={16} padding={0} />
          </div>
        )}
        {tokenSellAmountError && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ color: errorColor }}>{tokenSellAmountError}</div>
          </div>
        )}
        <Button
          style={{ alignSelf: "flex-end", width: "9rem", marginLeft: "auto" }}
          type={"primary"}
          disabled={!hasValidSellAmount}
          size="large"
          loading={selling}
          onClick={
            isSellAmountApproved
              ? async () => {
                  setSelling(true);

                  await tx(
                    writeContracts.Vendor.sellTokens(tokenSellAmount && ethers.utils.parseEther(tokenSellAmount)),
                    update => {
                      if (update && (update.error || update.reason)) {
                        setSelling(false);
                      }
                      if (update && (update.status === "confirmed" || update.status === 1)) {
                        setSelling(false);
                        setTokenSellAmount("");
                        setEthValueToSellTokens(null);
                        forceUpdate();
                      }
                      if (update && update.code) {
                        // metamask error etc.
                        setSelling(false);
                      }
                    },
                  );

                  // use this instead of the updates above if the updates are unreliable
                  // setSelling(false);
                  // setTokenSellAmount("");
                  // setEthValueToSellTokens(null);
                  // forceUpdate();
                }
              : async () => {
                  setSelling(true);

                  await tx(
                    writeContracts.SoRadToken.approve(
                      readContracts.Vendor.address,
                      tokenSellAmount && ethers.utils.parseEther(tokenSellAmount),
                    ),
                    update => {
                      if (update && (update.error || update.reason)) {
                        setSelling(false);
                      }
                      if (update && (update.status === "confirmed" || update.status === 1)) {
                        setSelling(false);
                        forceUpdate();
                      }
                      if (update && update.code) {
                        // metamask error etc.
                        setSelling(false);
                      }
                    },
                  );

                  // use this instead of the updates above if the updates are unreliable
                  // setSelling(false);
                  // forceUpdate();
                }
          }
        >
          {isSellAmountApproved || !hasValidSellAmount ? "Sell SRT" : "Approve SRT"}
        </Button>
      </div>
    </>
  );

  return (
    <div
      style={{
        margin: "0",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
      className="Vendor FlexCardCol"
    >
      <Card
        title={
          <div
            style={{
              position: "relative",

              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <SectionTitle text="Exchange" />{" "}
            <div
              style={{
                position: "absolute",
                right: "0rem",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "1.25rem",
              }}
            >
              <a href={`https://rinkeby.etherscan.io/address/${vendorAddress}`} target="blank">
                <LinkOutlined />
              </a>
            </div>
          </div>
        }
        style={{ width: "23rem", margin: "auto", background: swapGradient, height: height ?? "100%" }}
      >
        {!readyAll && (
          <div
            style={{
              height: "100%",
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
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {/* SWAP UI */}
            <div style={{ display: "flex", alignItems: "stretch", flexDirection: "column" }}>
              <div>
                <div
                  style={{
                    fontSize: "1rem",
                    color: "deeppink",
                    fontWeight: 500,
                    marginBottom: "1.5rem",
                    padding: "0.25rem 0",
                    borderTop: "1px solid rgba(255, 20, 147, 0.4)",
                    borderBottom: "1px solid rgba(255, 20, 147, 0.4)",
                    gap: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div>1 ETH </div>
                  <SwapOutlined />
                  <div> {tokensPerEth && tokensPerEth.toNumber()} SRT </div>
                </div>
                <Tabs defaultActiveKey="1" centered>
                  {[1, 2].map(idx => (
                    <TabPane
                      tab={
                        <span style={{ letterSpacing: "0.1rem", margin: "0 2.5rem" }}>
                          {idx === 1 ? "BUY" : "SELL"}
                        </span>
                      }
                      key={idx}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: "1rem",
                          paddingTop: "0.5rem",
                        }}
                      >
                        {idx === 1 ? buyPaneContent : sellPaneContent}
                      </div>
                    </TabPane>
                  ))}
                </Tabs>
              </div>
            </div>
            <div>
              <Divider orientation="left">Vendor Liquidity</Divider>
              <SrtEthBalances
                tokenBalance={vendorTokenBalance}
                ethBalance={vendorETHBalance}
                valuesColor={"deeppink"}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Vendor;
