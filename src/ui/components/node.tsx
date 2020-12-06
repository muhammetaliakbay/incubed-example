import * as React from "react";
import {Chip, Icon, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@material-ui/core";
import {ExtendedNodeInfo} from "../../engine/node-watch";
export function Node(
    {
        node
    }: {
        node: ExtendedNodeInfo
    }
) {
    return <>
        <TableCell>
            <pre>
                {node.signer}
            </pre>
        </TableCell>
        <TableCell>
            {node.status === 'registered' && <Icon color='primary'>verified_user</Icon>}
            {node.status === 'removed' && <Icon color='error'>highlight_off</Icon>}
        </TableCell>
        <TableCell>
            {node.url}
        </TableCell>
        <TableCell>
            {node.properties.proof && <Chip variant='outlined' style={{margin: '3px'}} label='proof' />}
            {node.properties.multichain && <Chip variant='outlined' style={{margin: '3px'}} label='multichain' />}
            {node.properties.archive && <Chip variant='outlined' style={{margin: '3px'}} label='archive' />}
            {node.properties.http && <Chip variant='outlined' style={{margin: '3px'}} label='http' />}
            {node.properties.binary && <Chip variant='outlined' style={{margin: '3px'}} label='binary' />}
            {node.properties.onion && <Chip variant='outlined' style={{margin: '3px'}} label='onion' />}
            {node.properties.signer && <Chip variant='outlined' style={{margin: '3px'}} label='signer' />}
            {node.properties.data && <Chip variant='outlined' style={{margin: '3px'}} label='data' />}
            {node.properties.stats && <Chip variant='default' onClick={
                () => alert(node.url + '/metrics')
            } style={{margin: '3px'}} label='stats' />}
        </TableCell>
        <TableCell>
            {node.properties.minBlockHeight.toString()}
        </TableCell>
        <TableCell>
            {node.deposit.toString()}
        </TableCell>
    </>;
}

export function NodeTable(
    {
        nodes
    }: {
        nodes: ExtendedNodeInfo[]
    }
) {
    return <TableContainer component={Paper}>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>
                        Signer
                    </TableCell>
                    <TableCell>
                        Available
                    </TableCell>
                    <TableCell>
                        URL
                    </TableCell>
                    <TableCell>
                        Properties
                    </TableCell>
                    <TableCell>
                        Min Block
                    </TableCell>
                    <TableCell>
                        Deposit
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {
                    nodes.map(
                        node => <TableRow key={node.signer}>
                            <Node key={node.signer} node={node} />
                        </TableRow>
                    )
                }
            </TableBody>
        </Table>
    </TableContainer>
}
