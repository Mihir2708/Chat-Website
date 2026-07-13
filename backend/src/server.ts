import { Server } from 'http';
import app from './app';
import config from './config';
import { connectDatabase } from './config/database';

let server: Server;

const startServer = async () => {

  server = app.listen(config.port, "0.0.0.0", () => {
    console.log(
      `Server is running in ${config.env} mode on port ${config.port}`
    );
  });

  await connectDatabase();
};
startServer();

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
