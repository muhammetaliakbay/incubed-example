import { deployContracts } from "../utils/deployment";
import {NodeRegistryApi} from "../engine/node-registry-api";
import { expect } from "chai";
import {createAccount} from "../utils/utils";
import {Subject} from "rxjs";
import {watchBlockChange, watchLatestBlock} from "../engine/block-watch";
import {toArray} from "rxjs/operators";

contract(
    'BlockWatch', () => {

        it('Should emit correct blocks', async () => {
            const contracts = await deployContracts(web3);
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const notifier = new Subject<void>();

            const blocks$ = watchLatestBlock(api, notifier);
            const [blocks] = await Promise.all([
                blocks$.pipe(toArray()).toPromise(),
                (async () => {
                    notifier.next();

                    await createAccount();
                    await createAccount();
                    notifier.next();

                    await createAccount();
                    await createAccount();
                    notifier.next();

                    notifier.next();

                    notifier.complete();
                })()
            ]);

            expect(blocks.length).eq(3);
        });

        it('Should emit correct blocks changes', async () => {
            const contracts = await deployContracts(web3);
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const notifier = new Subject<void>();

            const blocks$ = watchLatestBlock(api, notifier);
            const blocksChanges$ = watchBlockChange(blocks$);
            const [blockChanges] = await Promise.all([
                blocksChanges$.pipe(toArray()).toPromise(),
                (async () => {
                    notifier.next();

                    await createAccount();
                    await createAccount();
                    notifier.next();

                    await createAccount();
                    await createAccount();
                    notifier.next();

                    notifier.next();

                    notifier.complete();
                })()
            ]);

            expect(blockChanges.length).eq(2);
        });

    }
);
