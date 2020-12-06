import {IN3} from "in3-wasm";
import {buildProps} from "../engine/properties-util";
import Web3 from "web3";
import {NodeRegistryApi} from "../engine/node-registry-api";

export const web3$ = new Promise<Web3>((resolve) => {
    IN3.onInit(
        () => {
            const in3 = new IN3({
                nodeProps: '0x' + buildProps({
                    // archive: true
                }).toString(16),

                // proof               : 'standard',
                // signatureCount      : 2,
                // requestCount        : 2,
                chainId             : 'mainnet', //'0x11',
                // replaceLatestBlock  : 10,
                /*nodes: {
                    '0x11': {
                        contract: '0x0A64DF94bc0E039474DB42bb52FEca0c1d540402',
                        nodeList:  [{
                            url: 'http://localhost:8500',
                            chainIds: ['0x11'],
                            address: '0x00a329c0648769a73afac7f9381e08fb43dbea72',
                            deposit: 0
                        }]
                    }
                }*/
            });

            resolve(new Web3(in3.createWeb3Provider()));
        }
    );
});

export const api$ = web3$.then(
    web3 => new NodeRegistryApi(web3, '0x6c095a05764a23156efd9d603eada144a9b1af33')
);
