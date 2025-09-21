/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_API_BASE_URL: string;
    readonly REACT_APP_API_TIMEOUT: string;
    readonly REACT_APP_APP_NAME: string;
    readonly REACT_APP_APP_VERSION: string;
    readonly REACT_APP_ENABLE_DEVTOOLS: string;
    readonly REACT_APP_ENABLE_ANALYTICS: string;
    readonly REACT_APP_CACHE_STALE_TIME: string;
    readonly REACT_APP_CACHE_TIME: string;
    readonly REACT_APP_ENVIRONMENT: string;
  }
}
