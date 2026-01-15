import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import WebSocket from 'ws';
import { getConfig } from '../config.js';

interface RunOptions {
    watch?: boolean;
    open?: boolean;
}

export async function run(file: string, options: RunOptions): Promise<void> {
    const config = getConfig();

    if (!config.apiKey) {
        console.error(chalk.red('Error: Not authenticated'));
        console.log('Run: kyntrix login --api-key <your-api-key>');
        process.exit(1);
    }

    // Resolve file path
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`Error: File not found: ${filePath}`));
        process.exit(1);
    }

    // Detect language from extension
    const ext = path.extname(filePath).toLowerCase();
    let template: string;
    if (ext === '.py') {
        template = 'python';
    } else if (ext === '.js' || ext === '.ts' || ext === '.mjs') {
        template = 'node';
    } else {
        console.error(chalk.red(`Error: Unsupported file type: ${ext}`));
        console.log('Supported: .py, .js, .ts, .mjs');
        process.exit(1);
    }

    const spinner = ora('Uploading code...').start();

    try {
        // Create form data with the file
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        form.append('template', template);
        form.append('entryScript', path.basename(filePath));

        // Start the run
        const response = await fetch(`${config.apiUrl}/api/runs/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                ...form.getHeaders()
            },
            body: form as any
        });

        if (!response.ok) {
            const error = await response.json();
            spinner.fail(`Failed to start run: ${error.message || response.statusText}`);
            process.exit(1);
        }

        const { runId, traceUrl } = await response.json();
        spinner.succeed(`Run started: ${chalk.cyan(runId)}`);

        console.log('');
        console.log(`View trace: ${chalk.blue(traceUrl)}`);
        console.log('');

        // Open browser if not disabled
        if (options.open !== false) {
            const open = (await import('open')).default;
            await open(traceUrl);
        }

        // Connect to WebSocket for live updates
        const wsUrl = config.apiUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        const ws = new WebSocket(`${wsUrl}?runId=${runId}`, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`
            }
        });

        console.log(chalk.dim('Streaming execution trace...'));
        console.log('');

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'GraphDelta') {
                    // Show new nodes
                    for (const node of msg.newNodes || []) {
                        const icon = node.data?.status === 'ERROR' ? chalk.red('✗') : chalk.green('→');
                        console.log(`${icon} ${node.label}`);
                    }
                } else if (msg.type === 'RunComplete') {
                    console.log('');
                    if (msg.success) {
                        console.log(chalk.green('Run completed successfully'));
                    } else {
                        console.log(chalk.red('Run failed'));
                    }
                    ws.close();
                    process.exit(msg.success ? 0 : 1);
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        ws.on('error', (err) => {
            console.error(chalk.red(`WebSocket error: ${err.message}`));
        });

        ws.on('close', () => {
            console.log(chalk.dim('Connection closed'));
        });

    } catch (err) {
        spinner.fail(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
    }
}
