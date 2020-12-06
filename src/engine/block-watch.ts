import {Observable, timer} from "rxjs";
import {exhaustMap, filter, pairwise} from "rxjs/operators";
import {NodeRegistryApi} from "./node-registry-api";

/**
 * Requests latest block height number to the api for every emission of notifier observable.
 * If notifier parameter is a number instead of an observable, then accepts it as a number
 * which specifies notify periods in milliseconds.
 * Example Emissions: [1000, 1003] -> [1003, 1004] ...
 * @param api NodeRegistryApi instance to use when making requests
 * @param notifier An Observable instance to make new requests for each emission, or a number which specifies the notification period
 */
export function watchLatestBlock(
    api: NodeRegistryApi,
    notifier: Observable<void> | number = 60*1000
): Observable<bigint> {
    if (!(notifier instanceof Observable)) {
        notifier = timer(notifier, notifier) as any as Observable<void>
    }

    // Generate requests to find out latest block-height in a time period
    return notifier.pipe(
        // Piping with exhaustMap to ignore new requests while previous one is not completed yet
        exhaustMap(
            () => api.getBlockHeight()
        )
    );
}

/**
 * Emits a pair of previous known block height and latest block height for
 * every emission of block numbers. And filters out descending block numbers.
 * @param latestBlock$ Observable instance to get latest block height
 */
export function watchBlockChange(
    latestBlock$: Observable<bigint>
): Observable<[previous: bigint, latest: bigint]> {
    return latestBlock$.pipe(
        pairwise(), // Combines previous and last emitted values together in an array
        filter(
            // Filter out decreasing block numbers.
            // Actually, it would be an error, bug or malicious
            // act of node (In3 server) if block number gets decrease
            ([previous, latest]) => latest > previous
        )
    );
}
