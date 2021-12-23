import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch } from "antd";
import React, { useState } from "react";
import { Address, Balance, Events } from "../components";

export default function ExampleUI({
  mainnetProvider,
  localProvider,
  tx,
  readContracts,
  writeContracts,
}) {
  return (
    <div style={{ paddingBottom: "8rem" }}>
      {/*
        ⚙️ Here is an example UI that displays and sets the purpose in your smart contract:
      */}
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "64px auto 0"}}>

        Your Contract Address:
        <Address
          address={readContracts && readContracts.YourContract ? readContracts.YourContract.address : null}
          ensProvider={mainnetProvider}
          fontSize={16}
        />
        <Divider />
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              tx(writeContracts.YourContract.assignName("John-" + Math.floor(Math.random() * 1000)));
            }}
          >
            { 'assignName("John-xxx")' }
          </Button>
        </div>
        <div style={{ margin: 8 }}>
          <Button
            onClick={() => {
              tx(writeContracts.YourContract.assignNumber(Math.floor(Math.random() * 1000)));
            }}
          >
            { 'assignNumber(xxx)' }
          </Button>
        </div>
      </div>

      {/*
        📑 Maybe display a list of events?
          (uncomment the event and emit line in YourContract.sol! )
      */}
      <Events
        contracts={readContracts}
        contractName="YourContract"
        eventName="AssignedName"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />
      <Events
        contracts={readContracts}
        contractName="YourContract"
        eventName="AssignedNumber"
        localProvider={localProvider}
        mainnetProvider={mainnetProvider}
        startBlock={1}
      />
    </div>
  );
}
