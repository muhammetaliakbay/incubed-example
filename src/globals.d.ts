declare type Web3 = import('web3').default;
/**
 * Initialized in Truffle environment
 */
declare const web3: Web3;

/**
 * Only available in Truffle test environment.
 */
declare function contract(name: string, body: () => void);
