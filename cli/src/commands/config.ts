import chalk from 'chalk';
import { getConfig, setApiUrl } from '../config.js';

interface ConfigOptions {
    apiUrl?: string;
    show?: boolean;
}

export async function config(options: ConfigOptions): Promise<void> {
    if (options.apiUrl) {
        setApiUrl(options.apiUrl);
        console.log(chalk.green(`API URL set to: ${options.apiUrl}`));
        return;
    }

    if (options.show || Object.keys(options).length === 0) {
        const cfg = getConfig();
        console.log('Current configuration:');
        console.log('');
        console.log(`  API URL: ${chalk.cyan(cfg.apiUrl)}`);
        console.log(`  API Key: ${cfg.apiKey ? chalk.green(cfg.apiKey.slice(0, 8) + '...') : chalk.dim('(not set)')}`);
        console.log('');
        console.log('Environment variables:');
        console.log(`  KYNTRIX_API_KEY: ${process.env.KYNTRIX_API_KEY ? chalk.green('set') : chalk.dim('not set')}`);
        console.log(`  KYNTRIX_API_URL: ${process.env.KYNTRIX_API_URL ? chalk.green('set') : chalk.dim('not set')}`);
    }
}
