import startServer from './src/commands/start_server';

startServer({ mode: 'development', port: 8000, data: process.env.CICADA_DATA });
