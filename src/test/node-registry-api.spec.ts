import { deployContracts } from "../utils/deployment";
import {NodeProperties, NodeRegistryApi} from "../engine/node-registry-api";
import { expect } from "chai";
import {createAccount} from "../utils/utils";

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

const devPK = '0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7';
const Fail = Symbol('Fail');

contract(
    'NodeRegistryApi', () => {

        it('Should get correct NodeRegistryData contract address for given NodeRegistryLogic contract address', async () => {
            const contracts = await deployContracts(web3);
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            expect(await api.getDataContractAddress()).eq(contracts.nodeRegistryData);
        });

        it('Should return zero node count since no node registered yet', async () => {
            const contracts = await deployContracts(web3);
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            expect(await api.getNodesCount()).eq(0);
        });

        it('Should successfully register node and node count should return 1', async () => {
            const contracts = await deployContracts(web3, undefined, '0');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const signer = await createAccount();
            await api.registerNode({
                deposit: BigInt(0),
                url: 'http://localhost:8500',
                weight: 1,
                signer: signer.address,
                properties: simpleProperties
            }, {
                privateKey: signer.privateKey,
                from: signer.address,
                gas: BigInt(700000)
            });

            expect(await api.getNodesCount()).eq(1);
        });

        it('Should fail to register node due to min-deposit constraint', async () => {
            const contracts = await deployContracts(web3, undefined, '1000');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const signer = await createAccount();
            expect(
                await api.registerNode({
                    deposit: BigInt(10),
                    url: 'http://localhost:8500',
                    weight: 1,
                    signer: signer.address,
                    properties: simpleProperties
                }, {
                    privateKey: signer.privateKey,
                    from: signer.address,
                    gas: BigInt(700000)
                }).catch(
                    () => Fail
                )
            ).eq(Fail);
        });

        it('Should fail to register node when signers of transaction and node are not the same address', async () => {
            const contracts = await deployContracts(web3, undefined, '10');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const signer = await createAccount();
            expect(
                await api.registerNode({
                    deposit: BigInt(1000),
                    url: 'http://localhost:8500',
                    weight: 1,
                    signer: signer.address,
                    properties: simpleProperties
                }, {
                    privateKey: devPK,
                    from: '0x00a329c0648769a73afac7f9381e08fb43dbea72',
                    gas: BigInt(700000)
                }).catch(() => Fail)
            ).eq(Fail);
        });

        it('Should return correct node info by index', async () => {
            const contracts = await deployContracts(web3, undefined, '0');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const signer0 = await createAccount();
            const signer1 = await createAccount();

            await api.registerNode({
                deposit: BigInt(0),
                url: 'httq://fake-url:-1000',
                weight: 1,
                signer: signer0.address,
                properties: simpleProperties
            }, {
                privateKey: signer0.privateKey,
                from: signer0.address,
                gas: BigInt(700000)
            });

            await api.registerNode({
                deposit: BigInt(0),
                url: 'httq://another-fake-url:-2000',
                weight: 10,
                signer: signer1.address,
                properties: {
                    ...simpleProperties,
                    stats: false,
                    minBlockHeight: BigInt(10)
                }
            }, {
                privateKey: signer1.privateKey,
                from: signer1.address,
                gas: BigInt(700000)
            });



            const info0 = await api.getNodeInfoByIndex(0);

            expect(info0.url).eq('httq://fake-url:-1000');
            expect(info0.deposit.toString()).eq('0');
            expect(info0.signer).eq(signer0.address);
            expect(info0.weight).eq(1);
            expect(info0.properties.minBlockHeight.toString()).eq('0');
            expect(info0.properties.onion).false;
            expect(info0.properties.stats).true;



            const info1 = await api.getNodeInfoByIndex(1);

            expect(info1.url).eq('httq://another-fake-url:-2000');
            expect(info1.deposit.toString()).eq('0');
            expect(info1.signer).eq(signer1.address);
            expect(info1.weight).eq(10);
            expect(info1.properties.minBlockHeight.toString()).eq('10');
            expect(info1.properties.onion).false;
            expect(info1.properties.stats).false;
        });

        it('Should unregister node successfully', async () => {
            const contracts = await deployContracts(web3, undefined, '0');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const signer = await createAccount();
            await api.registerNode({
                deposit: BigInt(0),
                url: 'http://localhost:8500',
                weight: 1,
                signer: signer.address,
                properties: simpleProperties
            }, {
                privateKey: signer.privateKey,
                from: signer.address,
                gas: BigInt(700000)
            });

            expect(await api.getNodesCount()).eq(1);

            await api.unregisterNode(signer.address, {
                privateKey: signer.privateKey,
                from: signer.address,
                gas: BigInt(700000)
            });

            expect(await api.getNodesCount()).eq(0);

        });

        it('Should return correct event logs', async () => {
            const contracts = await deployContracts(web3, undefined, '0');
            const api = new NodeRegistryApi(
                web3, contracts.nodeRegistryLogic
            );

            const blockHeightA = await api.getBlockHeight();

            const signer = await createAccount();
            await api.registerNode({
                deposit: BigInt(0),
                url: 'http://localhost:8500',
                weight: 1,
                signer: signer.address,
                properties: simpleProperties
            }, {
                privateKey: signer.privateKey,
                from: signer.address,
                gas: BigInt(700000)
            });

            const blockHeightB = await api.getBlockHeight();

            expect(Number(blockHeightB.toString())).gt(Number(blockHeightA.toString()));

            const logsAB = await api.getLogs(blockHeightA, blockHeightB);

            expect(logsAB.length).eq(1);
            expect(logsAB[0].event).eq('LogNodeRegistered');

            await api.unregisterNode(signer.address, {
                privateKey: signer.privateKey,
                from: signer.address,
                gas: BigInt(700000)
            });

            const blockHeightC = await api.getBlockHeight();

            expect(Number(blockHeightC.toString())).gt(Number(blockHeightB.toString()));

            const logsBC = await api.getLogs(blockHeightB, blockHeightC);

            expect(logsBC.length).eq(1);
            expect(logsBC[0].event).eq('LogNodeRemoved');



            const logsAC = await api.getLogs(blockHeightA, blockHeightC);

            expect(logsAC.length).eq(2);
            expect(logsAC[0].event).eq('LogNodeRegistered');
            expect(logsAC[1].event).eq('LogNodeRemoved');

        });

    }
);
