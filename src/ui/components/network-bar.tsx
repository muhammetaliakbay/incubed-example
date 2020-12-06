import {
    AppBar,
    Box,
    Button,
    ButtonGroup,
    FormControlLabel,
    Icon,
    Radio,
    Toolbar,
    Typography,
    useTheme
} from "@material-ui/core";
import * as React from "react";
import {Network} from "../provider";

/**
 * Predefined networks to show in network-bar at the top of the page
 */
const predefinedNetworks: Network[] = [
    {
        chainId: 'mainnet',
        contractAddress: '0x6c095a05764a23156efd9d603eada144a9b1af33'
    },
    {
        chainId: 'kovan',
        contractAddress: '0xf14d54e349ac971ab6280d6d99f7152c9a06b0b3'
    },
    {
        chainId: 'goerli',
        contractAddress: '0x635cccc1db6fc9e3b029814720595092affba12f'
    }
];

export function NetworkBar(
    {
        network,
        setNetwork
    }: {
        network: Network | undefined,
        setNetwork: (network: Network) => void
    }
) {
    return <Toolbar>
        {predefinedNetworks.map(
            (predefinedNetwork, index) =>
                <FormControlLabel key={index}
                                  label={predefinedNetwork.chainId}
                                  control={
                                      <Radio
                                          color='primary'
                                          checked={
                                              network?.chainId === predefinedNetwork.chainId &&
                                              network?.contractAddress === predefinedNetwork.contractAddress
                                          }
                                          onChange={
                                              (event, checked) => {
                                                  if (checked) {
                                                      setNetwork(predefinedNetwork)
                                                  }
                                              }
                                          }
                                      />
                                  } />
        )} <pre>{network?.chainId} | {network?.contractAddress}</pre>
    </Toolbar>;
}