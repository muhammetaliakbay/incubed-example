import {app, BrowserWindow} from "electron";
import {retry} from "rxjs/operators";
import {NodeRegistryApi} from "../engine/node-registry-api";
import {Observable, timer} from "rxjs";
import {watchContract, watchNodes} from "../engine/node-watch";
import Web3 from "web3";
import {IN3} from "in3-wasm";
import {buildProps} from "../engine/properties-util";

export function isDev() {
    return process.argv.includes('--dev');
}

async function openWindow(
    api: NodeRegistryApi,
    notifyPeriod: number = 60*1000
) {

    const notifier = timer(0, notifyPeriod) as any as Observable<void>;

    const contractWatch$ = watchContract(
        api,
        notifier
    ).pipe(
        retry()
    );

    const nodeMap$ = watchNodes(
        contractWatch$
    );

    const window = new BrowserWindow({
        width: 1920*2/3,
        height: 1080*2/3,
        webPreferences: {
            nodeIntegration: true,
            additionalArguments: [
                ...(isDev() ? ['--dev'] : []),
            ],
        },
        // frame: false,
        title: 'Incubed Example Dashboard | Muhammet Ali AKBAY',
        // icon: './bundle/icons/middlegate-512p.png',
        show: false,
        frame: false
    });

    // Open the DevTools.
    if (isDev()) {
        window.webContents.openDevTools({
            mode: 'detach'
        });
    }
    window.removeMenu();

    window.webContents.addListener(
        'ipc-message', (event, channel) => {
            if (channel === 'listen') {
                nodeMap$.subscribe(
                    nodeMap => window.webContents.send('node-map', nodeMap)
                );
            }
        }
    );

    // and load the index.html of the app.
    await Promise.all([
        window.loadFile(`bundle/index.html`),
        new Promise<void>(resolve => {
            window.once('ready-to-show', () => {
                window.show();
                resolve(void 0);
            });
        })
    ]);

}

IN3.onInit(
    () => {
        const in3 = new IN3({
            nodeProps: '0x' + buildProps({
                archive: true
            }).toString(16),

            proof               : 'none',
            signatureCount      : 2,
            requestCount        : 2,
            chainId             : 'mainnet', //'0x11',
            replaceLatestBlock  : 10,
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

        const web3 = new Web3(in3.createWeb3Provider());
        const api = new NodeRegistryApi(web3, '0x6c095a05764a23156efd9d603eada144a9b1af33');

        // import {createLauncher} from './application/launcher';
        // import {uiEngine} from './engine/ui.engine';
        // createLauncher();

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.whenReady().then(
            () => openWindow(api)
        ).catch(
            err => {
                console.error('ERROR', err);
                app.quit();
            }
        );

        // Quit when all windows are closed.
        app.on('window-all-closed', () => {
            // On macOS it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

        app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                app.quit();
            }
        })

        // In this file you can include the rest of your app's specific main process
        // code. You can also put them in separate files and require them here.

        process.on('uncaughtException', error =>
            console.error('uncaughtException on main', error)
        );
        process.on('unhandledRejection', reason =>
            console.error('unhandledRejection on main', reason)
        );
    }
);
