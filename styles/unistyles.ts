import { UnistylesRegistry } from 'react-native-unistyles';
import { breakpoints } from './Breakpoints';
import { darkTheme } from './Themes';

type AppBreakpoints = typeof breakpoints;

type AppThemes = {
  dark: typeof darkTheme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  export interface UnistylesThemes extends AppThemes {}
}

UnistylesRegistry.addBreakpoints(breakpoints).addThemes({
  dark: darkTheme
});
