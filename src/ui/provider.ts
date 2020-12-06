import {IN3} from "in3-wasm";
import {buildProps} from "../engine/properties-util";
import Web3 from "web3";
import {NodeRegistryApi} from "../engine/node-registry-api";
import {ReplaySubject, Subject} from "rxjs";
import {concatMap, distinctUntilChanged, map, shareReplay, switchMap} from "rxjs/operators";
import {fromPromise} from "rxjs/internal-compatibility";

const onInit = new Promise<Web3>((resolve) => IN3.onInit(resolve.bind(undefined, void 0)));

export interface Network {
    chainId: string,
    contractAddress: string
}

const networkSubject = new ReplaySubject<Network>(1);
export const network$ = networkSubject.asObservable().pipe(
    distinctUntilChanged(
        (x, y) => x.chainId === y.chainId && x.contractAddress === y.contractAddress
    )
);
export function setNetwork(chainId: string, contractAddress: string) {
    networkSubject.next({
        chainId,
        contractAddress
    });
}

export const api$ = fromPromise(onInit).pipe(
    concatMap(() => network$),
    map(
        ({chainId, contractAddress}) => (
            new NodeRegistryApi(
                new Web3(
                    new IN3({
                        /*nodeProps: '0x' + buildProps({
                            // archive: true
                        }).toString(16),*/
                        chainId
                    }).createWeb3Provider()
                ),
                contractAddress
            )
        )
    ),
    shareReplay(1)
);
