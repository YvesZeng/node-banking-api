import './settings';
import 'reflect-metadata';
import logger from 'jet-logger';
import server from './infrastructure/api/server';
import { getDatabase } from './infrastructure/persistence/sqlite';

// Constants
const serverStartMsg = 'Express server started on port: ',
    port = process.env.PORT || 3000;

// Initialize database
getDatabase();
logger.info('Database initialized');

// Start server
server.listen(port, () => {
    logger.info(serverStartMsg + port);
});
