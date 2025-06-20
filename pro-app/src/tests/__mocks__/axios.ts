// Mock implementation of axios for testing
interface MockAxios {
  create: jest.MockedFunction<any>;
  get: jest.MockedFunction<any>;
  post: jest.MockedFunction<any>;
  put: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  patch: jest.MockedFunction<any>;
  interceptors: {
    request: {
      use: jest.MockedFunction<any>;
      clear: jest.MockedFunction<any>;
    };
    response: {
      use: jest.MockedFunction<any>;
      clear: jest.MockedFunction<any>;
    };
  };
  defaults: {
    headers: {
      common: Record<string, any>;
    };
  };
}

const axios: MockAxios = {
  create: jest.fn((): MockAxios => axios),
  get: jest.fn(() => Promise.resolve({ data: { incidents: [] } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: {
      use: jest.fn(),
      clear: jest.fn(),
    },
    response: {
      use: jest.fn(),
      clear: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
};

export default axios;
