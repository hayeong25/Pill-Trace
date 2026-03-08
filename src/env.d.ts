declare namespace NodeJS {
  interface ProcessEnv {
    DATA_GO_KR_API_KEY?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
