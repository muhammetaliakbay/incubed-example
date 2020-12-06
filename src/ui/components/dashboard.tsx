import {useObservable} from "react-use-observable";
import * as React from "react";
import {NodeTable} from './node';
import {
    ThemeProvider,
    createMuiTheme,
    Box,
    useMediaQuery,
    CssBaseline
} from '@material-ui/core';
import {blueGrey, grey} from '@material-ui/core/colors';
import {ApplicationAppBar} from "./app-bar";
import PerfectScrollbar from 'react-perfect-scrollbar';
import {catchError, ignoreElements, repeat, retry, scan} from "rxjs/operators";
import {ExtendedNodeInfo, NodeMap, watchContract, watchNodes} from "../../engine/node-watch";
import {NodeRegistryApi} from "../../engine/node-registry-api";
import {EMPTY, Observable, timer} from "rxjs";
import {Network} from "../provider";
import {NetworkBar} from "./network-bar";

const theme = createMuiTheme(
    {
        palette: {
            type: 'dark',
            // primary: cyan,
            // secondary: lime,
            primary: blueGrey,
            secondary: grey,
        }
    }
);

export function Dashboard(
    {
        api$,
        network$,
        setNetwork
    }: {
        api$: Observable<NodeRegistryApi>,
        network$: Observable<Network>,
        setNetwork: (network: Network) => void
    }
) {
    let [api] = useObservable(() => api$, [api$]);

    let [nodes] = useObservable(
        () => {
            if (api == undefined) {
                return EMPTY;
            } else {
                // Watch contract events, and keep up to date by checking latest block every 60 seconds
                const contractWatch$ = watchContract(
                    api,
                    60*1000
                ).pipe(
                    catchError(
                        err => {
                            // If an error occurs while watching contract events, log the error and
                            // wait for 15 seconds before re-subscribing the events
                            console.error(err);
                            return timer(15000).pipe(ignoreElements());
                        }
                    ),
                    repeat()
                );

                // Build a node-map and keep up to date by watching contract events
                const nodeMap$ = watchNodes(
                    contractWatch$
                );

                // Convert node-map to a node-list. Preserve the index of elements in the list
                // so the table doesn't act strange when new nodes found
                return nodeMap$.pipe(
                    scan<NodeMap, ExtendedNodeInfo[]>(
                        (list, map) => {
                            const newList = list.slice();
                            for (const node of Object.values(map)) {
                                const index = newList.findIndex(prev => prev.signer === node.signer);
                                if (index > -1) {
                                    newList[index] = node;
                                } else {
                                    newList.push(node);
                                }
                            }
                            return newList;
                        },
                        []
                    )
                );
            }
        },
         [ api ]
    );
    if (nodes == null) {
        nodes = [];
    }

    // Use current network (network changes when network-parameters gets changed)
    let [network] = useObservable( () => network$, [network$]);

    return <>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box position='relative' height='100%' display='flex' flexDirection='column' alignItems='stretch'>
                <ApplicationAppBar title='Incubed Example Dashboard | Muhammet Ali AKBAY'/>
                <NetworkBar network={network} setNetwork={setNetwork} />
                <Box flexGrow={1} minHeight={0} display='flex' flexDirection='row' alignItems='stretch'>
                    <div style={{flexGrow: 1, overflowY: 'auto', overflowX: 'hidden'}}>
                        <Box position='relative' height='100%'>
                            <PerfectScrollbar>
                                <NodeTable nodes={nodes} />
                            </PerfectScrollbar>
                        </Box>
                    </div>
                </Box>
            </Box>
        </ThemeProvider>
    </>;
}
