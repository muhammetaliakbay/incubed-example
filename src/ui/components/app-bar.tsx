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
                  variant='h6'
                  children={title} />
      <Box flexGrow={1} />
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
    </Toolbar>
  </AppBar>;
}
