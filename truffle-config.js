module.exports = {

  contracts_directory: './src/contracts',
  contracts_build_directory: './lib/contracts',

  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: '*',       // Any network (default: none)
      from: "00a329c0648769a73afac7f9381e08fb43dbea72" // pk: 0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.5.10+commit.5a6ea5b1",    // Fetch exact version from solc-bin (default: truffle's version)
      docker: false,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "byzantium"
      }
    }
  }
}
