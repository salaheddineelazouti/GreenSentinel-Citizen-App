import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Customize the color mode config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Define the custom colors
const colors = {
  primary: {
    50: '#fbeaec',
    100: '#f8d4d9',
    200: '#f2aab3',
    300: '#ec7f8d',
    400: '#e65f72',
    500: '#E63946', // Primary color as specified
    600: '#c82836',
    700: '#a61e2b',
    800: '#85181f',
    900: '#63131a',
  },
};

// Extend the theme with custom colors and config
const theme = extendTheme({
  config,
  colors,
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Button: {
      variants: {
        solid: (props: Record<string, any>) => ({
          bg: props.colorScheme === 'primary' ? 'primary.500' : undefined,
          color: props.colorScheme === 'primary' ? 'white' : undefined,
          _hover: {
            bg: props.colorScheme === 'primary' ? 'primary.600' : undefined,
          },
        }),
      },
    },
  },
});

export default theme;
