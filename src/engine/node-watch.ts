import {NodeInfo, NodeRegistryApi} from "./node-registry-api";
import {concat, defer, Observable, of, range} from "rxjs";
import {ContractLog} from "./contract-logs";
import {
    concatMap,
    distinctUntilChanged,
    filter,
    mergeMap,
    pairwise,
    scan
} from "rxjs/operators";
import {watchLatestBlock} from "./block-watch";
import {parseProps} from "./properties-util";
import {fromPromise} from "rxjs/internal-compatibility";

export interface ExtendedNodeInfo extends NodeInfo {
    status: 'registered' | 'removed',
    blockNumber: bigint,
    weight: number | undefined // Weight may be undefined if node found by update event.
                                // it requires to make a subsequent function call to the contract
                                // (it is not implemented yet)
}

/**
 * Only difference to 'watchLatestBlock' function is watchBlockChangeInternal emits
 * an initial [undefined, initial block height] emission.
 * Ex.: [undefined, 1000] -> [1000, 1003] -> [1003, 1004] ...
 * @see watchLatestBlock function in './block-watch' module.
 */
function watchBlockChangeInternal(
    api: NodeRegistryApi,
    notifier: Observable<void> | number = 60*1000
): Observable<[previous: bigint | undefined, latest: bigint]> {
    return concat(
        of(undefined),
        defer(() => api.getBlockHeight()),
        watchLatestBlock(
            api,
            notifier
        )
    ).pipe(
        pairwise(),
        filter(
            ([previous, latest]) => previous == undefined || latest > previous
        )
    );
}

/**
 * Finds currently registered node count and gets information all of them, first.
 * Then listens for each events of the NodeRegistryLogic contract to keep information
 * up to date.
 * @param api NodeRegistryApi to use to interact with contract
 * @param notifier Every emission of notifier (or period), makes requests to update information
 * @param maxBlockDelta If distance between previous block and latest block is higher than maxBlockDelta, makes
 * requests to get information of currently registered nodes. This is a requirement because, some web3 providers
 * (In3 in the case) doesn't let us to request for past events for blocks more than about 100. (or 1000 in non-verified mode)
 */
export function watchContract(
    api: NodeRegistryApi,
    notifier?: Observable<void> | number,
    maxBlockDelta: bigint = BigInt(100)
): Observable<ContractLog | NodeInfo> {
    return watchBlockChangeInternal(
        api,
        notifier
    ).pipe(
        concatMap(
            ([previous, latest]) => {
                if (previous == undefined || (latest - previous) > maxBlockDelta) {
                    // If the block is initial block (initial block is the latest one for first request) or
                    // distance between previous checked block and the latest one is greater than the amount
                    // permitted, make fresh requests to get currently registered nodes and their information
                    return defer(
                        () => api.getNodesCount(latest) // Get registered nodes count until the 'latest block'
                    ).pipe(
                        concatMap(
                            nodeCount => range(0, nodeCount) // Make requests for all the nodes with indices from 0 to nodeCount
                        ),
                        mergeMap(
                            // Get information of the node at the index in 'the block'
                            index => api.getNodeInfoByIndex(index, latest)
                        )
                    )
                } else {
                    // Otherwise, this means the distance between previously checked and the latest block is
                    // an amount big enough to get all events.
                    // Make a request to get all logs between the two blocks
                    return fromPromise(
                        api.getLogs(
                            previous, latest
                        )
                    ).pipe(
                        // Flatten the logs to emit separately
                        concatMap(logs => logs)
                    );
                }
            }
        )
    );
}

/**
 * NodeMap structure holds currently known registered and unregistered
 * nodes with their information by the signer (since signer is a unique address
 * by each node)
 */
export interface NodeMap {
    [signer: string]: ExtendedNodeInfo
}

/**
 * Takes initial and continuous information and events from the
 * NodeRegistryLogic contract, then compiles the current state of
 * registry using them.
 * Note: Emits a new state for every update from observable
 * @param contractWatch NodeInformation and Log observable to compile registry state
 */
export function watchNodes(
    contractWatch: Observable<ContractLog | NodeInfo>
): Observable<NodeMap> {
    return contractWatch.pipe(
        scan<ContractLog | NodeInfo, NodeMap>(
            (map, log) => {

                // Get last known information from the map of the signer
                const previousState = map[log.signer];

                if ('event' in log) {
                    // If it is an event log

                    // Check if it is a fresh information about the node.
                    // if previous information or its blockNumber is not defined
                    // or latest information's blockNumber is older than new one,
                    // it is fresh.
                    const fresh = previousState?.blockNumber == undefined || log.blockNumber > previousState.blockNumber;

                    if (fresh) {
                        // Do updates if it is a fresh information

                        if (log.event === 'LogNodeRegistered') {
                            return {
                                ...map,
                                [log.signer]: {
                                    blockNumber: log.blockNumber,
                                    signer: log.signer,
                                    url: log.url,
                                    deposit: BigInt(log.deposit.toString()),
                                    weight: undefined, // There is not weight information in LogNodeRegistered event.
                                                        // Todo: Need to make a subsequent call to the NodeRegistryData contract
                                                        // to get weight information. But it is not implemented yet.
                                    // Mark status as registered
                                    status: 'registered',
                                    properties: parseProps(BigInt(log.props.toString()))
                                }
                            }
                        } else if (log.event === 'LogNodeRemoved') {
                            if (previousState == undefined) {
                                // If removed node is already not in the map, do nothing
                                return map;
                            } else {
                                return {
                                    ...map,
                                    [log.signer]: {
                                        ...previousState,
                                        blockNumber: log.blockNumber,
                                        // Mark status as removed
                                        status: 'removed'
                                    }
                                };
                            }
                        } else if (log.event === 'LogNodeUpdated') {
                            if (previousState == undefined) {
                                // If updated node is not in the map, there is nothing to do.
                                // But to make a subsequent call to NodeRegistryData contract may be
                                // a good thing to do. But not implemented yet.
                                return map;
                            } else {
                                return {
                                    ...map,
                                    [log.signer]: {
                                        blockNumber: log.blockNumber,
                                        signer: log.signer,
                                        deposit: BigInt(log.deposit.toString()),
                                        url: log.url,
                                        // weight doesn't change in updates, it stays as is
                                        weight: previousState.weight,
                                        properties: parseProps(BigInt(log.props.toString())),
                                        // Status doesn't change in updates, it stays as is
                                        // There is no definition about the status of removed but
                                        // updated node in the contracts and documentations.
                                        status: previousState.status
                                    }
                                }
                            }
                        } else if (log.event === 'LogOwnershipChanged') {
                            if (previousState == undefined) {
                                // If updated node is not in the map, there is nothing to do.
                                // But to make a subsequent call to NodeRegistryData contract may be
                                // a good thing to do. But not implemented yet.
                                return map;
                            } else {
                                return {
                                    ...map,
                                    [log.oldOwner]: {
                                        ...previousState,
                                        // mark old node information as removed
                                        status: 'removed',
                                        blockNumber: log.blockNumber
                                    },
                                    [log.newOwner]: {
                                        ...previousState,
                                        // Do not change status for the new information,
                                        // keep it as is in the previous state.
                                        // There is no definition about the status of removed but
                                        // owner changed node in the contracts and documentations.
                                        blockNumber: log.blockNumber
                                    }
                                }
                            }
                        }
                    } else {
                        // Don't do any update if it is not a fresh information
                        return map;
                    }
                } else {
                    // If it is not a event log, it is an initial information
                    return {
                        ...map,
                        [log.signer]: {
                            ...log,
                            // Mark status as 'registered' since the information got by
                            // calling 'getNodeInfoByIndex' function of NodeRegistryData contract.
                            status: 'registered'
                        } as ExtendedNodeInfo
                    };
                }

            },
            {}
        )
    ).pipe(
        // If map object is not changed, do not emit it again
        distinctUntilChanged()
    );
}
