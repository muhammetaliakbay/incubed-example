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
import {NodeRegistryApiMirror} from "../api-mirror";
import {scan} from "rxjs/operators";
import {ExtendedNodeInfo, NodeMap} from "../../engine/node-watch";

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
        registry
    }: {
        registry: NodeRegistryApiMirror
    }
) {
    let [nodes] = useObservable(
        () => registry.nodeMap$.pipe(
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
        ),
         [ registry.nodeMap$ ]
    );
    if (nodes == null) {
        nodes = [];
    }

    return <>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box position='relative' height='100%' display='flex' flexDirection='column' alignItems='stretch'>
                <ApplicationAppBar title='Incubed Example Dashboard | Muhammet Ali AKBAY'/>
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
