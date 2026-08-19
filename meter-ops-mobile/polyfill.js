import React from 'react';

// Polyfill React.use for React 18 / Expo Router v6 compatibility
if (typeof React.use !== 'function') {
  React.use = function use(context) {
    return React.useContext(context);
  };
}
