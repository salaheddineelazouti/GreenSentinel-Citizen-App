// Mock pour import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        MODE: 'test',
        PROD: false,
        DEV: true,
        VITE_API_HOST: 'http://localhost:8000',
        VITE_WS_HOST: 'ws://localhost:8000',
      }
    }
  }
});
