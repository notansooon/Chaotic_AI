#!/usr/bin/env node

import { Command } from "commander"
import fs from "fs/promises"
import chalk from "chalk"
import ora from "ora"
import { glob } from "glob"
import path from "path"

// CONFIG: Point this to your instance-manager URL
const API_URL = process.env.KYNTRIX_API || 'http://localhost:3000';
const program = new Command();

interface ExecutionResult {
    runId: string;
    status: 'success' | 'error' | 'crashed';
    output?: string;
    error?: string;
    timeline?: TimelineEvent[];
    trace_url?: string;
}

interface TimelineEvent {
    function: string;
    duration: number;
    timestamp: number;
    error?: {
        type: string;
        message: string;
        line?: number;
    };
}

program
    .name("kyntrix")
    .description("Execution and Observability Platform for AI Agents")
    .version("0.0.1")

program
    .command("run <file_name>")
    .description("Run a script with full execution tracing")
    .option('-w, --watch', 'Watch for changes and re-run')
    .option('-v, --verbose', 'Show detailed trace information')
    .action(async (entryFile, options) => {
        try {
            await runWithTrace(entryFile, options);
        } catch (error) {
            console.error(chalk.red(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

program
    .command("trace <runId>")
    .description("View the execution trace for a previous run")
    .action(async (runId) => {
        const spinner = ora('Fetching trace...').start();
        try {
            const response = await fetch(`${API_URL}/api/v1/trace/${runId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch trace: ${response.statusText}`);
            }
            const trace = await response.json();
            spinner.stop();
            displayTrace(trace);
        } catch (error) {
            spinner.stop();
            console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

async function runWithTrace(entryFile: string, options: any) {
    // Check file exists
    try {
        await fs.access(entryFile);
    } catch {
        console.error(chalk.red(`❌ File not found: ${entryFile}`));
        process.exit(1);
    }

    const spinner = ora('Collecting project files...').start();

    try {
        // Gather all project files
        const filePaths = await glob("**/*", {
            ignore: ['node_modules/**', '.git/**', '.env', 'dist/**', '__pycache__/**', '*.pyc'],
            nodir: true,
            absolute: false
        });

        const fileMap: Record<string, string> = {};
        let fileCount = 0;

        for (const fp of filePaths) {
            if (isTextFile(fp)) {
                try {
                    const content = await fs.readFile(fp, 'utf-8');
                    fileMap[fp] = content;
                    fileCount++;
                } catch (err) {
                    // Skip files we can't read
                    continue;
                }
            }
        }

        spinner.text = `Uploading ${fileCount} files...`;

        // Submit execution request
        const response = await fetch(`${API_URL}/runs/start`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entry_point: entryFile,
                files: fileMap,
                language: getLanguage(entryFile)
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
        }

        const result: ExecutionResult = await response.json();
        spinner.stop();

        // Display results
        console.log(chalk.cyan(`\n✓ Execution started (${chalk.bold(result.runId)})\n`));

        if (result.status === 'success') {
            console.log(chalk.green('✓ Execution completed successfully\n'));
            
            if (result.output) {
                console.log(chalk.dim('─'.repeat(60)));
                console.log(chalk.bold('Output:'));
                console.log(result.output);
                console.log(chalk.dim('─'.repeat(60)));
            }

            if (options.verbose && result.timeline) {
                displayTimeline(result.timeline);
            }

        } else if (result.status === 'error' || result.status === 'crashed') {
            console.log(chalk.red('✗ Execution failed\n'));
            
            if (result.error) {
                console.log(chalk.red(result.error));
            }

            if (result.timeline) {
                console.log(chalk.yellow('\n📊 Execution Timeline:\n'));
                displayTimeline(result.timeline);
            }
        }

        // Always show trace URL
        if (result.trace_url || result.runId) {
            const traceUrl = result.trace_url || `${API_URL}/trace/${result.runId}`;
            console.log(chalk.cyan(`\n🔍 View full trace: ${chalk.underline(traceUrl)}`));
        }

    } catch (error) {
        spinner.stop();
        
        if (error instanceof Error) {
            if (error.message.includes('ECONNREFUSED')) {
                console.error(chalk.red('\n❌ Cannot connect to Kyntrix server'));
                console.error(chalk.yellow(`   Make sure the server is running at ${API_URL}`));
                console.error(chalk.dim(`   Start it with: npm run dev`));
            } else {
                console.error(chalk.red(`\n❌ Error: ${error.message}`));
            }
        } else {
            console.error(chalk.red(`\n❌ Unknown error: ${String(error)}`));
        }
        
        process.exit(1);
    }
}

function displayTimeline(timeline: TimelineEvent[]) {
    if (!timeline || timeline.length === 0) {
        console.log(chalk.dim('  (no trace data available)'));
        return;
    }

    timeline.forEach((event, index) => {
        const hasError = !!event.error;
        const icon = hasError ? '✗' : '✓';
        const color = hasError ? chalk.red : chalk.green;
        const durationStr = `${event.duration.toFixed(2)}ms`;

        console.log(color(`  ${icon} ${event.function}`) + chalk.dim(` (${durationStr})`));
        
        if (event.error) {
            console.log(chalk.red(`     └─ Error: ${event.error.type}: ${event.error.message}`));
            if (event.error.line) {
                console.log(chalk.red(`        at line ${event.error.line}`));
            }
        }
    });
}

function displayTrace(trace: any) {
    console.log(chalk.bold('\n📊 Execution Trace\n'));
    
    if (trace.timeline) {
        displayTimeline(trace.timeline);
    }
    
    if (trace.variables) {
        console.log(chalk.bold('\n📦 Variable State:\n'));
        for (const [key, value] of Object.entries(trace.variables)) {
            console.log(`  ${chalk.cyan(key)}: ${JSON.stringify(value, null, 2)}`);
        }
    }
}

function getLanguage(filename: string): string {
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.js') || filename.endsWith('.ts')) return 'node';
    if (filename.endsWith('.go')) return 'go';
    if (filename.endsWith('.rs')) return 'rust';
    return 'unknown';
}

function isTextFile(file: string): boolean {
    const ext = path.extname(file).toLowerCase();
    const binaryExtensions = [
        '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
        '.exe', '.bin', '.pyc', '.pyo', '.so', '.dylib', '.dll',
        '.zip', '.tar', '.gz', '.7z', '.rar',
        '.mp3', '.mp4', '.avi', '.mov',
        '.pdf', '.doc', '.docx'
    ];
    return !binaryExtensions.includes(ext);
}

// Parse and run
program.parse(process.argv);