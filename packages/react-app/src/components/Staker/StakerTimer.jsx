import { ClockCircleOutlined } from "@ant-design/icons";
import humanizeDuration from "humanize-duration";
import React from "react";
import { primaryCol, softTextCol } from "../../styles";

const StakerTimer = ({ timeLeft }) => {
  let timeLeftNum = timeLeft && timeLeft.toNumber();

  const isOver = timeLeftNum === 0;
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {!isOver && (
          <div
            style={{
              animation: "tick 1s cubic-bezier(0, 0.99, 0, 0.99) infinite",
              display: "block",
              color: isOver ? "#cdcdcd" : primaryCol,
              // border: "4px solid currentColor",
              boxShadow: "0 0 28px 2px currentColor inset",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "8rem",
              height: "8rem",
              borderRadius: "50%",
            }}
          ></div>
        )}
        <ClockCircleOutlined
          style={{
            display: "block",
            zIndex: 2,
            opacity: 0.1,
            fontSize: "8rem",
            color: isOver ? "#cdcdcd" : primaryCol,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        {isOver && <span style={{ fontSize: "1.5rem", color: softTextCol }}>Time is up! </span>}
        {!isOver &&
          timeLeftNum &&
          timeLeftNum !== 0 &&
          humanizeDuration(timeLeftNum * 1000, { units: ["d", "h", "m", "s"] })
            .split(",")
            .map((part, index) => (
              <p
                style={{
                  fontSize: `${1.5 - index * 0.125}rem`,
                  lineHeight: "2.5rem",
                  color: softTextCol,
                  margin: 0,
                  padding: 0,
                }}
              >
                {part}
              </p>
            ))}
      </div>
    </div>
  );
};

export default StakerTimer;
