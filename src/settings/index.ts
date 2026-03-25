import path from 'path';
import dotenv from 'dotenv';
import commandLineArgs from 'command-line-args';

(() => {
    // Setup command line options
    const options = commandLineArgs([
        {
            name: 'env',
            alias: 'e',
            defaultValue: 'development',
            type: String,
        },
    ]) as { env: string };
    // Set the env file
    const envVars = dotenv.config({
        path: path.join(__dirname, `env/${options.env}.env`),
    });
    if (envVars.error) {
        throw envVars.error;
    }
})();
