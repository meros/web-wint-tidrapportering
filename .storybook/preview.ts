import type { Preview } from '@storybook/react';
import '../src/tokens.css';
import '../src/global.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#FFF4E0' },
        { name: 'white', value: '#FFFFFF' },
        { name: 'dark', value: '#1A1A2E' },
      ],
    },
  },
};

export default preview;
