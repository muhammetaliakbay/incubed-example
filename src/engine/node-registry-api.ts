import {buildProps, parseProps} from "./properties-util";
import BigNumber from "bignumber.js";
import {ContractLog} from "./contract-logs";
import {loadABI} from "./abi-util";

// ABI of compiled NodeRegistryLogic contract
const logicABI = loadABI('NodeRegistryLogic');
// ABI of compiled NodeRegistryData contract
const dataABI = loadABI('NodeRegistryData');

export interface NodeProperties {
    proof: boolean,
    multichain: boolean,
    archive: boolean,
    http: boolean,
    binary: boolean,
    onion: boolean,
    signer: boolean,
    data: boolean,
    stats: boolean,
    minBlockHeight: bigint
}

export interface NodeInfo {
    url: string,
    signer: string,
    deposit: bigint,
    weight: number,
    properties: NodeProperties,
    blockNumber?: bigint
}

export interface TransactionProperties{
    privateKey: string,
    from: string,
    gas: bigint,
    nonce?: number,
    gasPrice?: bigint | string
}

type In3Node = [
    url: string,
    deposit: BigNumber,
    registerTime: BigNumber,
    props: BigNumber,
    weight: BigNumber,
    signer: string,
    proofHash: string
];

/**
 * NodeRegistryApi instance is heart of the engine. It simply provides an
 * interface between Web3 instance and the rest of engine.
 * The Web3 instance can be created using any provider including In3's web3-provider.
 * NodeRegistryApi instance also need address of the NodeRegistryLogic contract
 * to interact with by sending transactions and calling functions.
 */
export class NodeRegistryApi {
    /**
     * @param web3 Web3 instance to use to interact with network
     * @param contractAddress contract address to interact with NodeRegistryLogic proxy contract
     */
    constructor(
        readonly web3: Web3,
        readonly contractAddress: string
    ) {
    }

    // create web3 contract instance using abi and contract address
    private logicContract = new this.web3.eth.Contract(logicABI, this.contractAddress);
    // makes a request to get address of NodeRegistryData contract to
    // be used when making requests to get information of nodes
    // Note: NodeRegistryLogic contract is a proxy contract.
    private dataContractAddress$ = this.logicContract.methods.nodeRegistryData().call();
    // create a web3 contract instance using the abi and requested address of NodeRegistryData contract
    private dataContract$ = this.dataContractAddress$.then(
        dataContractAddress => new this.web3.eth.Contract(dataABI, dataContractAddress)
    );

    getDataContractAddress(): Promise<string> {
        return this.dataContractAddress$;
    }

    /**
     * Makes a request to 'totalNodes():uint64' function of logic contract.
     * The result specifies number of currently registered nodes (In3 servers).
     * If a blockNumber parameter specified, then makes sure the result must
     * specify the node number in block at 'blockNumber'.
     * Specifying blockNumber is a requirement when doing recurring requests
     * based on the result.
     * @param blockNumber Block height number to look state for. Or leave undefined to use latest block.
     */
    getNodesCount(blockNumber?: bigint): Promise<number> {
        return this.logicContract.methods.totalNodes()
            .call(undefined, blockNumber?.toString())
            .then(bn => Number(bn.toString()));
    }

    private async tx(data: string, {gasPrice, from, gas, nonce, privateKey}: TransactionProperties, to: string): Promise<void> {
        if (gasPrice == undefined) {
            // if gasPrice is not specified, first request for it
            gasPrice = await this.web3.eth.getGasPrice();
        }
        if (nonce == undefined) {
            // if nonce is not specified, first request for it
            nonce = await this.web3.eth.getTransactionCount(from);
        }

        // creates a signed version of the transaction before send
        const signed = await this.web3.eth.accounts.signTransaction({
            gasPrice: gasPrice.toString(),
            gas: gas.toString(),
            data,
            nonce,
            from,
            to
        }, privateKey);

        // sends the signed transaction
        await (this.web3.eth.sendSignedTransaction(signed.rawTransaction));
    }

    /**
     * Tries to register a node.
     * @param nodeInfo contains information about the node which we are going to register
     * @param transactionProperties contains secondary information about the transaction.
     */
    async registerNode(nodeInfo: NodeInfo, transactionProperties: TransactionProperties): Promise<void> {
        if (nodeInfo.signer !== transactionProperties.from) {
            // check if signer in the nodeInfo is exactly same address with the signer of this transaction
            throw new Error('Node\'s signer and tx\'s signer must be same address');
        }

        // compiles the function call into ABI structure before signing it
        const abi = this.logicContract.methods.registerNode(
            nodeInfo.url, buildProps(nodeInfo.properties).toString(),
            nodeInfo.weight, nodeInfo.deposit.toString()
        ).encodeABI();

        // sign the function call and send to the network
        await this.tx(abi, transactionProperties, this.contractAddress);
    }

    /**
     * Requests for the node info at specified index. If a blockNumber
     * specified, then it looks for the state in an exact block.
     * To specify 'blockNumber' is a requirement when making recurring calls to
     * avoid wrong information if there will be modification while making the request.
     * @param index Node index in the contract's current (or in block at 'blockNumber') state
     * @param blockNumber Block height number to look state for. Or leave undefined to use latest block.
     */
    async getNodeInfoByIndex(index: number, blockNumber?: bigint): Promise<NodeInfo> {
        // Get NodeRegistryData contract to interact with
        const dataContract = await this.dataContract$;

        // Request the function call in the contract
        const [
            url,
            deposit,
            registerTime,
            props,
            weight,
            signer,
            proofHash
        ]: In3Node = await dataContract.methods.getIn3NodeInformation(index).call(undefined, blockNumber?.toString());

        return {
            signer,
            // Parse properties by flags
            properties: parseProps(BigInt(props.toString())),
            weight: Number(weight.toString()),
            url,
            deposit: BigInt(deposit.toString()),
            // Save blockNumber if specified, it will make us able to keep
            // node information up to date.
            blockNumber
        };
    }

    /**
     * Tries unregistering a node.
     * @param signer Every node has a unique signer address. Signer used to specify the node to unregister.
     * @param transactionProperties contains secondary information about the transaction.
     */
    async unregisterNode(signer: string, transactionProperties: TransactionProperties): Promise<void> {
        if (signer !== transactionProperties.from) {
            // Check if signer in the nodeInfo is exactly same address with the signer of this transaction
            throw new Error('Node\'s signer and tx\'s signer must be same address');
        }

        // Compiles the function call into ABI structure before signing it
        const abi = this.logicContract.methods.unregisteringNode(
            signer
        ).encodeABI();

        // Sends the signed transaction
        await this.tx(abi, transactionProperties, this.contractAddress);
    }

    private async getLogsByEvent<E extends string>(
        name: E, startBlock: bigint, endBlock: bigint
    ): Promise<(Extract<ContractLog, { event: E }> & {blockNumber: number;})[]> {
        /*
        Note: Listening for events is not an option when using In3 web3 provider.
        So it is better to make request for every update on block height. (It is only option)
         */
        return (
            await this.logicContract.getPastEvents(name, {
                fromBlock: startBlock.toString(),
                toBlock: endBlock.toString()
            })
        ).map(
            log => ({
                // Put event name to be able to make filters
                event: log.event,
                // Parameters of event
                ...log.returnValues,
                // blockNumber will be required when checking if the information is fresh or not
                blockNumber: log.blockNumber
            })
        ) as any;
    }

    /**
     * Requests for logs between two blocks specified by 'startBlock' and 'endBlock' parameters.
     * Start block is not inclusive. Lookup will start from next block to the startBlock.
     * If end block is not specified, then there will be a request to specify latest block and use.
     * @param startBlock exclusive
     * @param endBlock inclusive, leave undefined to use latest block
     */
    async getLogs(startBlock: bigint, endBlock?: bigint): Promise<ContractLog[]> {
        if (endBlock == undefined) {
            endBlock = await this.getBlockHeight();
        }

        const effectiveStartBlock = startBlock + BigInt(1);

        // Make separate requests for different events then concat them
        const allLogs = await Promise.all([
            this.getLogsByEvent('LogNodeRegistered', effectiveStartBlock, endBlock),
            // this.getLogsByEvent('LogNodeConvicted', effectiveStartBlock, endBlock),
            this.getLogsByEvent('LogNodeRemoved', effectiveStartBlock, endBlock),
            this.getLogsByEvent('LogNodeUpdated', effectiveStartBlock, endBlock),
            this.getLogsByEvent('LogOwnershipChanged', effectiveStartBlock, endBlock),
            // this.getLogsByEvent('LogDepositReturned', effectiveStartBlock, endBlock),
        ]) as (ContractLog & {blockNumber: number;})[][];

        return allLogs.flatMap(
            logs => logs
        ).sort(
            // After making concatenation, sort the events by block-numbers as ascending order.
            // So there will be no misordering in events.
            // Todo: I couldn't find how to sort events if they are in the same block.
            //  This would be a caution in theory.
            (a, b) => a.blockNumber - b.blockNumber
        );
    }

    /**
     * Requests for the number of latest block in the network.
     */
    async getBlockHeight(): Promise<bigint> {
        return BigInt((await this.web3.eth.getBlock('latest')).number);
    }
}
