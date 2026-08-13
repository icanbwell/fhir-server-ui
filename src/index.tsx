import React from 'react';
import ReactDOM from 'react-dom/client';
import { init, browserSessionIntegration } from '@sentry/react';
import './index.css';
// b.well brand fonts (Brand Style Guide section 3.1): Quicksand for headings/display, Open Sans for body.
import '@fontsource/quicksand/latin-400.css';
import '@fontsource/quicksand/latin-600.css';
import '@fontsource/quicksand/latin-700.css';
import '@fontsource/open-sans/latin-300.css';
import '@fontsource/open-sans/latin-400.css';
import '@fontsource/open-sans/latin-600.css';
import '@fontsource/open-sans/latin-700.css';

import App from './App';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Initialize Sentry
if (import.meta.env.REACT_APP_SENTRY_DSN) {
  init({
    dsn: import.meta.env.REACT_APP_SENTRY_DSN,
    environment: import.meta.env.REACT_APP_ENVIRONMENT,
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/#removing-a-default-integration
    integrations: function (integrations) {
      return integrations.filter(function (integration) {
        return integration.name !== browserSessionIntegration.name;
      });
    },
  });
}

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <LocalizationProvider dateAdapter={AdapterDayjs} >
        <App />
      </LocalizationProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Container not found');
}

