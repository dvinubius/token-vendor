import { Descriptions } from "antd";
import React from "react";
import CustomBalance from "../CustomKit/CustomBalance";
import "./SrtEthBalances.css";

const SrtEthBalances = ({ tokenBalance, ethBalance, valuesColor }) => {
  const labelCol = "hsl(0, 0%, 40%)";
  const valuesCol = valuesColor ?? labelCol;

  const labelStyle = { fontSize: "1rem", display: "flex", justifyContent: "center", color: labelCol };
  const balanceWrapperStyle = { width: "100%", display: "flex", justifyContent: "flex-end" };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        color: valuesColor,
      }}
      className="SrtEthBalances"
    >
      <Descriptions bordered size="small" style={{ backgroundColor: "white", width: "100%" }}>
        {[0, 1].map(idx => (
          <Descriptions.Item label={<span style={labelStyle}>{idx === 0 ? "SRT" : "ETH"}</span>} span={6}>
            <div style={balanceWrapperStyle}>
              <CustomBalance
                customSymbol=""
                balance={idx === 0 ? tokenBalance : ethBalance}
                size="1rem"
                padding={0}
                noClick
                customColor={valuesCol}
              />
            </div>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};
export default SrtEthBalances;
