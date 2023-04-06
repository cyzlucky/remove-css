import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import NativeSelect from '@mui/material/NativeSelect';
import { Theme, ThemeProvider, createTheme } from '@mui/material';

const defaultTheme = createTheme({
  components: {}
});

export interface SelectComponentProps {
  label?: string;
  value?: string;
  theme?: Theme;
}

export default function SelectComponent({ label, theme = defaultTheme }: SelectComponentProps) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <ThemeProvider theme={theme}>
        <FormControl fullWidth>
          <InputLabel
            variant="standard"
            htmlFor="uncontrolled-native"
          >
            {label ?? "Select"}
          </InputLabel>
          <NativeSelect
            inputProps={{
              name: 'age',
              id: 'uncontrolled-native',
            }}
          >
            <option value={10}>Ten</option>
            <option value={20}>Twenty</option>
            <option value={30}>Thirty</option>
          </NativeSelect>
        </FormControl>
      </ThemeProvider>
    </Box>
  );
}
