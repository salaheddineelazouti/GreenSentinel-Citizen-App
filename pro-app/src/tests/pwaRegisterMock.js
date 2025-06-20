// Mock pour PWA Register
const useRegisterSW = () => ({
  needRefresh: [false, () => {}],
  offlineReady: [false, () => {}],
  updateServiceWorker: jest.fn(),
});

module.exports = { useRegisterSW };
