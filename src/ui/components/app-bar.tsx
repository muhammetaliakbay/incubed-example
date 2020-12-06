import * as React from 'react';
import {
  AppBar,
  Box,
  Button, ButtonGroup,
  Icon,
  Toolbar,
  Typography,
  useTheme
} from '@material-ui/core';
import isElectron from 'is-electron';

export function ApplicationAppBar(
  {
    title
  }: {
    title: string
  }
) {
  const theme = useTheme();

  return <AppBar position='sticky'
                 style={{
                   zIndex: theme.zIndex.drawer + 1,
                   // @ts-ignore
                   WebkitAppRegion: 'drag'
                 }}>
    <Toolbar>
      <Box flexGrow={1}/>
      <Typography noWrap
                  variant='h6'>
        {title} {
          isElectron() || <>
              | <Button style={{
              // @ts-ignore
              WebkitAppRegion: 'no-drag'
            }} variant='outlined' target='__blank' href='https://github.com/muhammetaliakbay/incubed-example'>Github Repository</Button>
          </>
        }
      </Typography>
      <Box flexGrow={1} />
      {
        isElectron() && (
            <ButtonGroup style={{
              // @ts-ignore
              WebkitAppRegion: 'no-drag'
            }} size='small' variant='text' color='primary'>
              <Button color='inherit' onClick={() => {
                window.close();
              }}>
                <Icon>close</Icon>
              </Button>
            </ButtonGroup>
        )
      }
    </Toolbar>
  </AppBar>;
}
