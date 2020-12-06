import {app, BrowserWindow} from "electron";
import {NodeRegistryApi} from "../engine/node-registry-api";

export function isDev() {
    return process.argv.includes('--dev');
}

async function openWindow() {
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


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(
    () => openWindow()
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
