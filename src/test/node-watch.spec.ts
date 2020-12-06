import { deployContracts } from "../utils/deployment";
import {NodeProperties, NodeRegistryApi} from "../engine/node-registry-api";
import { expect } from "chai";
import {createAccount} from "../utils/utils";
import {Subject} from "rxjs";
import {toArray} from "rxjs/operators";
import {watchContract, watchNodes} from "../engine/node-watch";

const simpleProperties: NodeProperties = {
    proof: true,
    archive: true,
    binary: true,
    data: true,
    http: true,
    minBlockHeight: BigInt(0),
    multichain: false,
    onion: false,
    signer: false,
    stats: true
};

contract(
    'NodeWatch', () => {

        it('Should keep node map entries up to date with correct info of nodes', async () => {
            const contracts = await deployContracts(web3, undefined, '0');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const notifier = new Subject<void>();

            const contractWatch$ = watchContract(
                api,
                notifier
            );

            const map$ = watchNodes(
                contractWatch$
            );

            const [maps] = await Promise.all([
                map$.pipe(toArray()).toPromise(),
                (async () => {
                    notifier.next();

                    const signer0 = await createAccount();
                    await api.registerNode({
                        deposit: BigInt(0),
                        url: 'url-0',
                        weight: 1,
                        signer: signer0.address,
                        properties: simpleProperties
                    }, {
                        privateKey: signer0.privateKey,
                        from: signer0.address,
                        gas: BigInt(700000)
                    });
                    notifier.next();

                    const signer1 = await createAccount();
                    const signer2 = await createAccount();
                    notifier.next();

                    await api.registerNode({
                        deposit: BigInt(0),
                        url: 'url-1',
                        weight: 1,
                        signer: signer1.address,
                        properties: simpleProperties
                    }, {
                        privateKey: signer1.privateKey,
                        from: signer1.address,
                        gas: BigInt(700000)
                    });
                    notifier.next();

                    await api.unregisterNode(signer0.address, {
                        privateKey: signer0.privateKey,
                        from: signer0.address,
                        gas: BigInt(700000)
                    });

                    notifier.next();

                    notifier.complete();
                })()
            ]);

            expect(maps.length).gt(0);
            const map = maps[maps.length - 1];

            const nodes = Object.values(map);

            expect(nodes.length).eq(2);

            const node0 = nodes.find(info => info.url === 'url-0');
            const node1 = nodes.find(info => info.url === 'url-1');

            expect(node0).not.undefined;
            expect(node1).not.undefined;

            expect(node0.status).eq('removed');
            expect(node1.status).eq('registered');
        });

    }
);
