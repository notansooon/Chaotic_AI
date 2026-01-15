import chalk from 'chalk';
import { setApiKey, getConfig } from '../config.js';

interface LoginOptions {
    apiKey?: string;
}

export async function login(options: LoginOptions): Promise<void> {
    const apiKey = options.apiKey || process.env.KYNTRIX_API_KEY;

    if (!apiKey) {
        console.error(chalk.red('Error: API key required'));
        console.log('');
        console.log('Usage:');
        console.log('  kyntrix login --api-key <your-api-key>');
        console.log('  # or');
        console.log('  export KYNTRIX_API_KEY=<your-api-key>');
        console.log('');
        console.log('Get your API key at: https://app.kyntrix.io/settings/api');
        process.exit(1);
    }

    // Validate the API key by making a request
    const config = getConfig();
    try {
        const response = await fetch(`${config.apiUrl}/health`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            setApiKey(apiKey);
            console.log(chalk.green('Successfully authenticated!'));
            console.log(`API key saved. You can now use ${chalk.cyan('kyntrix run')}`);
        } else {
            console.error(chalk.red('Authentication failed: Invalid API key'));
            process.exit(1);
        }
    } catch (err) {
        // If server is unreachable, still save the key
        setApiKey(apiKey);
        console.log(chalk.yellow('Warning: Could not validate API key (server unreachable)'));
        console.log('API key saved locally.');
    }
}
