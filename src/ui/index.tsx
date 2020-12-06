import {render} from 'react-dom';
import * as React from 'react';

import './index.scss';
import 'react-perfect-scrollbar/dist/css/styles.css';
import 'fontsource-roboto/index.css';
import 'material-icons-font/material-icons-font.css';
import {Dashboard} from "./components/dashboard";
import {api$, network$, setNetwork} from "./provider";

process.on('uncaughtException', error =>
    console.error('uncaughtException on index', error)
);
process.on('unhandledRejection', reason =>
    console.error('unhandledRejection on index', reason)
);

const content = document.querySelector("#content");

setNetwork('mainnet', '0x6c095a05764a23156efd9d603eada144a9b1af33');

render(<Dashboard api$={api$} network$={network$} setNetwork={network => setNetwork(network.chainId, network.contractAddress)} />, content);