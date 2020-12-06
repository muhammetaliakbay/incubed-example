import {render} from 'react-dom';
import * as React from 'react';

import './index.scss';
import 'react-perfect-scrollbar/dist/css/styles.css';
import 'fontsource-roboto/index.css';
import 'material-icons-font/material-icons-font.css';
import {ReplaySubject} from "rxjs";
import {ipcRenderer} from "electron";
import {Dashboard} from "./components/dashboard";
import {NodeMap} from "../engine/node-watch";
import {NodeRegistryApiMirror} from "./api-mirror";

process.on('uncaughtException', error =>
    console.error('uncaughtException on index', error)
);
process.on('unhandledRejection', reason =>
    console.error('unhandledRejection on index', reason)
);

const content = document.querySelector("#content");

const nodeMap$ = new ReplaySubject<NodeMap>(1);
ipcRenderer.on('node-map', (event, nodeMap) => nodeMap$.next(nodeMap));
ipcRenderer.send('listen');

const mirror: NodeRegistryApiMirror = {
    nodeMap$
};

render(<Dashboard registry={mirror} />, content);
