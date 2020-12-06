import BigNumber from "bignumber.js";

export interface LogNodeRegistered {
    event: 'LogNodeRegistered',
    url: string,
    props: BigNumber,
    signer: string,
    deposit: BigNumber,
    blockNumber: bigint
}

/*export interface LogNodeConvicted {
    event: 'LogNodeConvicted',
    signer: string,
    blockNumber: bigint
}*/

export interface LogNodeRemoved {
    event: 'LogNodeRemoved',
    url: string,
    signer: string,
    blockNumber: bigint
}

export interface LogNodeUpdated {
    event: 'LogNodeUpdated',
    url: string,
    props: BigNumber,
    signer: string,
    deposit: BigNumber,
    blockNumber: bigint
}

export interface LogOwnershipChanged {
    event: 'LogOwnershipChanged',
    signer: string,
    oldOwner: string,
    newOwner: string,
    blockNumber: bigint
}

/*export interface LogDepositReturned {
    event: 'LogDepositReturned'
    signer: string,
    owner: string,
    deposit: BigNumber,
    erc20Token: string,
    blockNumber: bigint
}*/

export type ContractLog =
    /*LogDepositReturned | */LogOwnershipChanged |
    LogNodeUpdated | LogNodeRemoved | /*LogNodeConvicted | */LogNodeRegistered;
