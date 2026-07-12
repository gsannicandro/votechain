require("@nomicfoundation/hardhat-toolbox");

const ADMIN_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

module.exports = {
  solidity: "0.8.30",
  paths: {
    tests: "./test",
  },
  networks: {
    hardhat: {
      chainId: 1337,

      initialBaseFeePerGas: 0,
      gasPrice: 0,

      accounts: {
        count: 1,
        accountsBalance: "10000000000000000000000",
      },
    },

    chain_one: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      gasPrice: 0,
      accounts: [ADMIN_PRIVATE_KEY],
    },

    chain_two: {
      url: "http://127.0.0.1:8546",
      chainId: 1337,
      gasPrice: 0,
      accounts: [ADMIN_PRIVATE_KEY],
    },
  },
};
