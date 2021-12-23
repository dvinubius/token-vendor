import React from "react";
import { Balance } from "..";

const StakerBanner = ({ complete, balance, failed, externalContractBalance }) => {
  if (!complete && !failed) return "";
  const bg = complete ? "rgb(24 144 255 / 100%)" : "rgb(24 144 255 / 20%)";
  const border = complete ? "1px solid #aeaeae" : "1px solid #dedede";
  const col = complete ? "#fefefe" : "4a4a4a";
  const contentFontSize = complete ? "1.5rem" : "1.25rem";
  const balanceZero = balance && balance.toNumber && balance.eq("0");
  return (
    <div
      style={{
        padding: "0.5rem",
        width: "35rem",
        margin: "0 auto 1rem",
        background: bg,
        border: border,
        color: col,
        fontSize: contentFontSize,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {complete && (
        <div style={{ display: "flex", alignItems: "center" }}>
          🚀 🎖 👩‍🚀 -- <Balance etherMode balance={externalContractBalance} fontSize={"4rem"} /> FTW -- 🎉 🍾 🎊
        </div>
      )}
      {failed && (
        <>
          <span style={{}}>Threshold not reached </span>
          <span style={{ fontSize: "1.15em", margin: "0 0.5rem" }}>😟</span>
          {!balanceZero && <span style={{}}>You can withdraw</span>}
        </>
      )}
    </div>
  );
};

export default StakerBanner;
