import React from 'react';
import ReactDOM from 'react-dom/client';
import { init, browserSessionIntegration } from '@sentry/react';
import './index.css';
// Get material fonts: https://mui.com/material-ui/getting-started/installation/#font-installation
import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';

import App from './App';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { APP_ENV } from './runtimeEnv';

// Initialize Sentry
if (APP_ENV.REACT_APP_SENTRY_DSN) {
  init({
    dsn: APP_ENV.REACT_APP_SENTRY_DSN,
    environment: APP_ENV.REACT_APP_ENVIRONMENT,
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

