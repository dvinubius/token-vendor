import React from "react";
import { Card, Progress, Divider } from "antd";
import { Balance } from "..";
import { softTextCol } from "../../styles";

const TotalStaker = ({ complete, totalStakedValue, price, isOver, threshold, belowThreshold, openForWithdraw }) => {
  const stakedTotalPercentBn = totalStakedValue && threshold && totalStakedValue.mul("100").div(threshold);
  const stakedTotalPercent = stakedTotalPercentBn && stakedTotalPercentBn.toNumber();
  const titleFontSize = "1rem";
  const balanceFontSize = "1.25rem";

  return (
    <Card style={{ padding: 8, width: "18rem", opacity: complete ? 0.5 : 1 }}>
      {openForWithdraw && (
        <>
          <div style={{ fontSize: titleFontSize, color: softTextCol, marginBottom: "1rem" }}>Total to Withdraw</div>
          <Balance etherMode balance={totalStakedValue} size={balanceFontSize} price={price} />
        </>
      )}
      {!openForWithdraw && (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ fontSize: titleFontSize, color: softTextCol }}>Staked</div>
              <Balance etherMode balance={totalStakedValue} size={balanceFontSize} price={price} padding={0} />
            </div>
            <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "black", opacity: 0.1 }}></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: titleFontSize, color: softTextCol }}>Target</div>
              <Balance etherMode balance={threshold} size={balanceFontSize} price={price} padding={0} />
            </div>
          </div>
          <Progress
            style={{ opacity: isOver && belowThreshold ? 0.5 : 1, margin: "0.5rem 0 0" }}
            percent={stakedTotalPercent}
            size="large"
          />
        </div>
      )}
    </Card>
  );
};

export default TotalStaker;
