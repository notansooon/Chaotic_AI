#!/usr/bin/env node

import { Command } from 'commander';
import { run } from './commands/run.js';
import { login } from './commands/login.js';
import { config } from './commands/config.js';
import { getConfig } from './config.js';

const program = new Command();

program
    .name('kyntrix')
    .description('Trace your code execution with AI-powered observability')
    .version('0.1.0');

program
    .command('login')
    .description('Authenticate with Kyntrix cloud')
    .option('-k, --api-key <key>', 'API key (or set KYNTRIX_API_KEY env var)')
    .action(login);

program
    .command('run <file>')
    .description('Run and trace a Python or Node.js script')
    .option('-w, --watch', 'Watch for file changes and re-run')
    .option('--no-open', 'Do not open browser automatically')
    .action(run);

program
    .command('config')
    .description('View or set configuration')
    .option('--api-url <url>', 'Set the Kyntrix API URL')
    .option('--show', 'Show current configuration')
    .action(config);

program
    .command('whoami')
    .description('Show current authentication status')
    .action(async () => {
        const cfg = getConfig();
        if (cfg.apiKey) {
            console.log(`Authenticated with API key: ${cfg.apiKey.slice(0, 8)}...`);
            console.log(`API URL: ${cfg.apiUrl}`);
        } else {
            console.log('Not authenticated. Run: kyntrix login');
        }
    });

program.parse();
