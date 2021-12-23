const Staker = () => {
  return (
    <>
      <Card
        style={{
          width: "35rem",
          margin: "0 auto",
          background: "linear-gradient(-45deg, #40A9FF0c, transparent)",
        }}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              alignSelf: "center",
              width: "100%",
            }}
          >
            <div style={{ fontSize: "1.25rem" }}>Staker Contract</div>

            <Address
              noBlockie={true}
              fontSize={"1.25rem"}
              value={readContracts && readContracts.Staker && readContracts.Staker.address}
            />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: "1rem" }}>
            <div
              style={{
                flex: "1 1 auto",
                alignSelf: "stretch",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {timeLeft && deadLine && <StakerTimer timeLeft={timeLeft}></StakerTimer>}
            </div>
            <TotalStaker
              complete={complete}
              totalStakedValue={totalStakedValue}
              price={price}
              isOver={isOver}
              threshold={threshold}
              belowThreshold={belowThreshold}
              openForWithdraw={openForWithdraw}
            />
          </div>
        </div>
      </Card>

      {showExecute && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ margin: "2rem" }}>
            <Button
              size="large"
              loading={pendingUnlock}
              style={{ width: 180 }}
              type="primary"
              onClick={() => {
                setPendingUnlock(true);
                tx(writeContracts.Staker.execute(), update => {
                  if (update && (update.error || update.reason)) {
                    setPendingUnlock(false);
                  }
                  if (update && (update.status === "confirmed" || update.status === 1)) {
                    setPendingUnlock(false);
                    forceUpdate();
                  }
                  if (update && update.code) {
                    setPendingUnlock(false);
                  }
                });
              }}
            >
              {executeText} {executeIcon}
            </Button>
          </div>
        </div>
      )}
      {!showExecute && <div style={{ margin: "2rem" }}></div>}

      <Card
        style={{
          width: "35rem",
          margin: "0 auto",
          background: "linear-gradient(-45deg, #40A9FF0c, transparent)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: showWithdrawAction || showStakeAction ? "space-between" : "center",
            alignItems: "center",
          }}
        >
          {(showWithdrawAction || showStakeAction) && (
            <div
              style={{
                minWidth: "10rem",
                flex: "1 1 auto",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: "1rem",
              }}
            >
              {showWithdrawAction && (
                <>
                  <AddressInput
                    autoFocus
                    ensProvider={mainnetProvider}
                    placeholder="Enter address"
                    value={withdrawAddress}
                    onChange={setWithdrawAddress}
                  />
                  <Button
                    size="large"
                    style={{ minWidth: "10rem" }}
                    loading={pendingWithdrawal}
                    disabled={withdrawableAmountZero || withdrawableBalanceError}
                    type={"default"}
                    onClick={() => {
                      setPendingWithdrawal(true);
                      tx(writeContracts.Staker.withdraw(withdrawAddress), update => {
                        if (update && (update.error || update.reason)) {
                          setPendingWithdrawal(false);
                        }
                        if (update && (update.status === "confirmed" || update.status === 1)) {
                          setPendingWithdrawal(false);
                          forceUpdate();
                        }
                        if (update && update.code) {
                          setPendingWithdrawal(false);
                        }
                      });
                    }}
                  >
                    Withdraw <RollbackOutlined />
                  </Button>
                </>
              )}
              {showStakeAction && (
                <AddStake
                  tx={tx}
                  writeContracts={writeContracts}
                  price={price}
                  forceUpdate={forceUpdate}
                  userBalanceZero={userBalanceZero}
                />
              )}
            </div>
          )}

          <Card size="small" style={{ padding: 8, width: "15rem", color: primaryCol, flexShrink: 0 }}>
            <div style={{ fontSize: "1.25rem", color: particularBalanceColor }}>{particularBalanceTitle}</div>
            {withdrawableBalanceError && <span style={{ fontSize: "1.5rem" }}>...</span>}
            {!withdrawableBalanceError && (
              <Balance etherMode balance={particularBalanceAmount} fontSize={64} price={price} />
            )}
          </Card>
        </div>
      </Card>

      <div style={{ width: 500, margin: "auto", marginTop: 64 }}>
        <div style={{ color: softTextCol, fontSize: "1rem" }}>Stake Events</div>
        <List
          dataSource={stakeEvents}
          renderItem={item => {
            return (
              <List.Item key={item.blockNumber}>
                <Address value={item.args[0]} ensProvider={mainnetProvider} fontSize={16} /> {"=>"}
                <Balance etherMode balance={item.args[1]} />
              </List.Item>
            );
          }}
        />
      </div>
    </>
  );
};
