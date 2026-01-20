#!/usr/bin/env node

import { Command } from "commander"
import { execSync } from "child_process"
import fs from "fs/promises"
import chalk from "chalk"
import ora from "ora"
import path from "path"
import os from "os"

const API_URL = process.env.KYNTRIX_API || 'http://localhost:4318';
const CONFIG_DIR = path.join(os.homedir(), '.kyntrix');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const program = new Command();

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

interface Config {
    apiKey?: string;
    apiUrl?: string;
}

async function loadConfig(): Promise<Config> {
    try {
        const content = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(content);
    } catch {
        return {};
    }
}

async function saveConfig(config: Config): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function getApiKey(): Promise<string | undefined> {
    // Check environment variable first
    if (process.env.KYNTRIX_API_KEY) {
        return process.env.KYNTRIX_API_KEY;
    }

    // Check config file
    const config = await loadConfig();
    return config.apiKey;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const apiKey = await getApiKey();
    if (!apiKey) {
        return {};
    }
    return { 'Authorization': `Bearer ${apiKey}` };
}

// ============================================================================
// TYPES
// ============================================================================

interface ExecutionResult {
    runId: string;
    status: 'success' | 'error' | 'crashed';
    output?: string;
    error?: string;
    timeline?: TimelineEvent[];
    trace_url?: string;
    cache_hit?: boolean;
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

interface GitInfo {
    url: string;
    commit: string;
    branch?: string;
    entryPoint: string;
}

interface DeviceCodeResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
    interval: number;
}

// ============================================================================
// PROGRAM SETUP
// ============================================================================

program
    .name("kyntrix")
    .description("Execution and Observability Platform for AI Agents")
    .version("0.0.1")

// ============================================================================
// AUTH COMMANDS
// ============================================================================

program
    .command("login")
    .description("Authenticate with Kyntrix")
    .option('--api-key <key>', 'Use an API key directly')
    .action(async (options) => {
        try {
            if (options.apiKey) {
                // Direct API key login
                await loginWithApiKey(options.apiKey);
            } else {
                // Device flow login
                await loginWithDeviceFlow();
            }
        } catch (error) {
            console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

program
    .command("logout")
    .description("Log out and remove stored credentials")
    .action(async () => {
        try {
            const config = await loadConfig();
            delete config.apiKey;
            await saveConfig(config);
            console.log(chalk.green('\nLogged out successfully'));
        } catch (error) {
            console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

program
    .command("whoami")
    .description("Show current user information")
    .action(async () => {
        try {
            const apiKey = await getApiKey();

            if (!apiKey) {
                console.log(chalk.yellow('\nNot logged in'));
                console.log(chalk.dim('Run `kyntrix login` to authenticate'));
                process.exit(1);
            }

            const spinner = ora('Fetching user info...').start();

            const response = await fetch(`${API_URL}/me`, {
                headers: await getAuthHeaders(),
            });

            if (!response.ok) {
                spinner.stop();
                if (response.status === 401) {
                    console.log(chalk.red('\nInvalid or expired API key'));
                    console.log(chalk.dim('Run `kyntrix login` to re-authenticate'));
                    process.exit(1);
                }
                throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }

            const user = await response.json();
            spinner.stop();

            console.log(chalk.bold('\nLogged in as:\n'));
            console.log(`  Email: ${chalk.cyan(user.email)}`);
            console.log(`  Name:  ${user.name || chalk.dim('(not set)')}`);
            console.log(`  Tier:  ${chalk.green(user.tier)}`);
            console.log(`  Runs:  ${user._count?.runs || 0}`);
            console.log(`  Keys:  ${user._count?.apiKeys || 0}`);
            console.log('');

        } catch (error) {
            console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

program
    .command("api-keys")
    .description("Manage API keys")
    .action(async () => {
        try {
            const apiKey = await getApiKey();

            if (!apiKey) {
                console.log(chalk.yellow('\nNot logged in'));
                console.log(chalk.dim('Run `kyntrix login` to authenticate'));
                process.exit(1);
            }

            const spinner = ora('Fetching API keys...').start();

            const response = await fetch(`${API_URL}/api-keys`, {
                headers: await getAuthHeaders(),
            });

            if (!response.ok) {
                spinner.stop();
                throw new Error(`Failed to fetch API keys: ${response.statusText}`);
            }

            const { keys } = await response.json();
            spinner.stop();

            if (keys.length === 0) {
                console.log(chalk.yellow('\nNo API keys found'));
                console.log(chalk.dim('Create one at your dashboard or using the API'));
                return;
            }

            console.log(chalk.bold('\nYour API Keys:\n'));
            for (const key of keys) {
                const prefix = key.keyPrefix;
                const lastUsed = key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleDateString()
                    : 'Never';

                console.log(`  ${chalk.cyan(key.name)}`);
                console.log(chalk.dim(`    ID: ${key.id}`));
                console.log(chalk.dim(`    Prefix: ${prefix}...`));
                console.log(chalk.dim(`    Last used: ${lastUsed}`));
                console.log(chalk.dim(`    Usage: ${key.usageCount} requests`));
                console.log('');
            }

        } catch (error) {
            console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

async function loginWithApiKey(apiKey: string): Promise<void> {
    const spinner = ora('Validating API key...').start();

    // Validate the key
    const response = await fetch(`${API_URL}/me`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) {
        spinner.stop();
        throw new Error('Invalid API key');
    }

    const user = await response.json();
    spinner.stop();

    // Save the key
    const config = await loadConfig();
    config.apiKey = apiKey;
    await saveConfig(config);

    console.log(chalk.green(`\nLogged in as ${chalk.bold(user.email)}`));
    console.log(chalk.dim(`API key saved to ${CONFIG_FILE}`));
}

async function loginWithDeviceFlow(): Promise<void> {
    const spinner = ora('Requesting device code...').start();

    // Request device code
    const codeResponse = await fetch(`${API_URL}/device/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!codeResponse.ok) {
        spinner.stop();
        throw new Error('Failed to start device flow');
    }

    const deviceCode: DeviceCodeResponse = await codeResponse.json();
    spinner.stop();

    // Show instructions
    console.log(chalk.bold('\nTo authenticate, visit:\n'));
    console.log(`  ${chalk.cyan.underline(deviceCode.verification_uri_complete)}`);
    console.log('');
    console.log(`Or go to ${chalk.cyan(deviceCode.verification_uri)}`);
    console.log(`and enter code: ${chalk.bold.yellow(deviceCode.user_code)}`);
    console.log('');

    // Poll for completion
    const pollSpinner = ora('Waiting for authorization...').start();

    const expiresAt = Date.now() + deviceCode.expires_in * 1000;
    const interval = deviceCode.interval * 1000;

    while (Date.now() < expiresAt) {
        await sleep(interval);

        const tokenResponse = await fetch(`${API_URL}/device/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                device_code: deviceCode.device_code,
                grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenResponse.ok && tokenData.access_token) {
            pollSpinner.stop();

            // Save the token
            const config = await loadConfig();
            config.apiKey = tokenData.access_token;
            await saveConfig(config);

            // Fetch user info
            const userResponse = await fetch(`${API_URL}/me`, {
                headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
            });

            if (userResponse.ok) {
                const user = await userResponse.json();
                console.log(chalk.green(`\nLogged in as ${chalk.bold(user.email)}`));
            } else {
                console.log(chalk.green('\nLogin successful!'));
            }

            console.log(chalk.dim(`Credentials saved to ${CONFIG_FILE}`));
            return;
        }

        if (tokenData.error === 'expired_token') {
            pollSpinner.stop();
            throw new Error('Authorization expired. Please try again.');
        }

        // Continue polling for 'authorization_pending'
    }

    pollSpinner.stop();
    throw new Error('Authorization timed out. Please try again.');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// RUN COMMANDS
// ============================================================================

program
    .command("run <file_or_url>")
    .description("Run from local file or git repository")
    .option('--branch <branch>', 'Git branch (default: main)', 'main')
    .option('--commit <sha>', 'Specific commit SHA')
    .option('--force-upload', 'Upload files even if git repo detected')
    .option('-v, --verbose', 'Show detailed trace information')
    .action(async (input, options) => {
        try {
            // Check authentication
            const apiKey = await getApiKey();
            if (!apiKey) {
                console.log(chalk.yellow('\nAuthentication required'));
                console.log(chalk.dim('Run `kyntrix login` to authenticate first'));
                process.exit(1);
            }

            if (isGitUrl(input)) {
                await runFromGitUrl(input, options);
            } else {
                await runFromLocalPath(input, options);
            }
        } catch (error) {
            console.error(chalk.red(`\n Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

program
    .command("trace <runId>")
    .description("View the execution trace for a previous run")
    .action(async (runId) => {
        const spinner = ora('Fetching trace...').start();
        try {
            const response = await fetch(`${API_URL}/api/run/${runId}/graph`, {
                headers: await getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch trace: ${response.statusText}`);
            }
            const trace = await response.json();
            spinner.stop();
            displayTrace(trace);
        } catch (error) {
            spinner.stop();
            console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

program
    .command("runs")
    .description("List recent runs")
    .option('-n, --limit <number>', 'Number of runs to show', '10')
    .action(async (options) => {
        try {
            const apiKey = await getApiKey();
            if (!apiKey) {
                console.log(chalk.yellow('\nNot logged in'));
                console.log(chalk.dim('Run `kyntrix login` to authenticate'));
                process.exit(1);
            }

            const spinner = ora('Fetching runs...').start();

            const response = await fetch(`${API_URL}/api/run?limit=${options.limit}`, {
                headers: await getAuthHeaders(),
            });

            if (!response.ok) {
                spinner.stop();
                throw new Error(`Failed to fetch runs: ${response.statusText}`);
            }

            const runs = await response.json();
            spinner.stop();

            if (runs.length === 0) {
                console.log(chalk.yellow('\nNo runs found'));
                return;
            }

            console.log(chalk.bold('\nRecent Runs:\n'));
            for (const run of runs) {
                const status = run.status === 'completed'
                    ? chalk.green('completed')
                    : run.status === 'error'
                    ? chalk.red('error')
                    : chalk.yellow('running');

                const date = new Date(run.createdAt).toLocaleString();

                console.log(`  ${chalk.cyan(run.id.slice(0, 8))} ${status} ${chalk.dim(date)}`);
                if (run.label) {
                    console.log(chalk.dim(`    ${run.label}`));
                }
            }
            console.log('');

        } catch (error) {
            console.error(chalk.red(`\nError: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    })

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isGitUrl(input: string): boolean {
    return input.includes('github.com') ||
           input.includes('gitlab.com') ||
           input.includes('bitbucket.org') ||
           input.startsWith('git@') ||
           input.startsWith('https://') ||
           input.startsWith('http://');
}

async function runFromGitUrl(gitUrl: string, options: any) {
    const spinner = ora('Parsing git URL...').start();

    try {
        const gitInfo = parseGitUrl(gitUrl, options);

        spinner.text = 'Resolving commit...';

        // Get commit SHA if not provided
        if (!gitInfo.commit && !options.commit) {
            gitInfo.commit = await resolveCommit(gitInfo.url, options.branch);
        } else if (options.commit) {
            gitInfo.commit = options.commit;
        }

        spinner.text = `Submitting execution (${gitInfo.commit.slice(0, 7)})...`;

        await executeGitBased(gitInfo, spinner, options);

    } catch (error) {
        spinner.stop();
        throw error;
    }
}

async function runFromLocalPath(filePath: string, options: any) {
    const spinner = ora('Checking execution mode...').start();

    try {
        // Check file exists
        await fs.access(filePath);

        // Try to detect git repository
        if (!options.forceUpload) {
            const gitInfo = await detectLocalGitRepo(filePath);

            if (gitInfo) {
                spinner.text = 'Git repository detected!';
                console.log(chalk.cyan('\n Detected git repository'));
                console.log(chalk.dim(`   ${gitInfo.url}@${gitInfo.commit.slice(0, 7)}`));

                const fileSize = await estimateUploadSize();
                console.log(chalk.green(`   Saved ${formatBytes(fileSize)} upload!\n`));

                await executeGitBased(gitInfo, spinner, options);
                return;
            }
        }

        // Fallback to file upload
        spinner.text = 'Using file upload mode...';
        console.log(chalk.yellow('\n No git repository detected, uploading files'));
        console.log(chalk.dim('   Tip: Push to GitHub and use git mode for 10x speedup!\n'));

        await executeFileBased(filePath, spinner, options);

    } catch (error) {
        spinner.stop();
        throw error;
    }
}

async function detectLocalGitRepo(filePath: string): Promise<GitInfo | null> {
    try {
        // Check if in git repo
        const gitRoot = execSync('git rev-parse --show-toplevel', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();

        // Check if repo is clean
        const status = execSync('git status --porcelain', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });

        if (status.trim() !== '') {
            console.log(chalk.yellow('\n Git repo has uncommitted changes'));
            console.log(chalk.dim('   Commit your changes to use git mode\n'));
            return null;
        }

        // Get repo info
        const remoteUrl = execSync('git config --get remote.origin.url', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();

        const currentCommit = execSync('git rev-parse HEAD', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();

        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        }).trim();

        // Calculate relative path
        const relativePath = path.relative(gitRoot, path.resolve(filePath));

        return {
            url: normalizeGitUrl(remoteUrl),
            commit: currentCommit,
            branch: currentBranch,
            entryPoint: relativePath
        };

    } catch (error) {
        return null;
    }
}

function parseGitUrl(input: string, options: any): GitInfo {
    // Format 1: github.com/user/repo/blob/branch/path/to/file.py
    const match1 = input.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/);
    if (match1) {
        const [_, user, repo, branch, filePath] = match1;
        return {
            url: `https://github.com/${user}/${repo}`,
            commit: '', // Will be resolved
            branch,
            entryPoint: filePath
        };
    }

    // Format 2: github.com/user/repo@commit:path/to/file.py
    const match2 = input.match(/^(?:https?:\/\/)?([^@]+)@([^:]+):(.+)$/);
    if (match2) {
        const [_, repoUrl, commit, filePath] = match2;
        return {
            url: normalizeGitUrl(repoUrl),
            commit,
            entryPoint: filePath
        };
    }

    // Format 3: Just repo URL (use default entry point)
    return {
        url: normalizeGitUrl(input),
        commit: '',
        entryPoint: options.entryPoint || 'main.py'
    };
}

function normalizeGitUrl(url: string): string {
    // Convert SSH to HTTPS
    if (url.startsWith('git@')) {
        url = url.replace('git@', 'https://').replace('.com:', '.com/');
    }

    // Remove .git suffix
    url = url.replace(/\.git$/, '');

    // Ensure https://
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    return url;
}

async function resolveCommit(repoUrl: string, branch: string): Promise<string> {
    // Try GitHub API first
    if (repoUrl.includes('github.com')) {
        const apiUrl = repoUrl
            .replace('https://github.com/', 'https://api.github.com/repos/')
            + `/commits/${branch}`;

        try {
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                return data.sha;
            }
        } catch (error) {
            // Fall through to git ls-remote
        }
    }

    // Fallback: Use git ls-remote
    try {
        const result = execSync(`git ls-remote ${repoUrl} ${branch}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });
        const commit = result.split('\t')[0];
        if (commit) return commit;
    } catch (error) {
        throw new Error(`Failed to resolve commit for branch ${branch}`);
    }

    throw new Error('Could not resolve commit SHA');
}

async function executeGitBased(gitInfo: GitInfo, spinner: ora.Ora, options: any) {
    spinner.text = 'Submitting git-based execution...';

    const response = await fetch(`${API_URL}/api/run`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders(),
        },
        body: JSON.stringify({
            execution_mode: "git",
            git_url: gitInfo.url,
            commit_sha: gitInfo.commit,
            branch: gitInfo.branch,
            entry_point: gitInfo.entryPoint,
            language: getLanguageFromPath(gitInfo.entryPoint)
        })
    });

    await handleResponse(response, spinner, options);
}

async function executeFileBased(filePath: string, spinner: ora.Ora, options: any) {
    spinner.text = 'Collecting files...';

    // Original file upload implementation
    const content = await fs.readFile(filePath, 'utf-8');

    const response = await fetch(`${API_URL}/api/run`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            ...await getAuthHeaders(),
        },
        body: JSON.stringify({
            execution_mode: "files",
            entry_point: filePath,
            files: { [filePath]: content },
            language: getLanguageFromPath(filePath)
        })
    });

    await handleResponse(response, spinner, options);
}

async function handleResponse(response: Response, spinner: ora.Ora, options: any) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const result: ExecutionResult = await response.json();
    spinner.stop();

    // Display results
    console.log(chalk.cyan(`\n Run started (${chalk.bold(result.runId)})\n`));

    if (result.cache_hit) {
        console.log(chalk.green(' Using cached repository\n'));
    }

    if (result.status === 'success') {
        console.log(chalk.green(' Execution completed successfully\n'));

        if (result.output) {
            console.log(chalk.dim(''.repeat(60)));
            console.log(chalk.bold('Output:'));
            console.log(result.output);
            console.log(chalk.dim(''.repeat(60)));
        }

        if (options.verbose && result.timeline) {
            displayTimeline(result.timeline);
        }

    } else if (result.status === 'error' || result.status === 'crashed') {
        console.log(chalk.red(' Execution failed\n'));

        if (result.error) {
            console.log(chalk.red(result.error));
        }

        if (result.timeline) {
            console.log(chalk.yellow('\n Execution Timeline:\n'));
            displayTimeline(result.timeline);
        }
    }

    // Always show trace URL
    if (result.trace_url || result.runId) {
        const traceUrl = result.trace_url || `${API_URL}/trace/${result.runId}`;
        console.log(chalk.cyan(`\n View full trace: ${chalk.underline(traceUrl)}`));
    }
}

function displayTimeline(timeline: TimelineEvent[]) {
    if (!timeline || timeline.length === 0) {
        console.log(chalk.dim('  (no trace data available)'));
        return;
    }

    timeline.forEach((event) => {
        const hasError = !!event.error;
        const icon = hasError ? 'x' : 'v';
        const color = hasError ? chalk.red : chalk.green;
        const durationStr = `${event.duration.toFixed(2)}ms`;

        console.log(color(`  ${icon} ${event.function}`) + chalk.dim(` (${durationStr})`));

        if (event.error) {
            console.log(chalk.red(`     Error: ${event.error.type}: ${event.error.message}`));
            if (event.error.line) {
                console.log(chalk.red(`        at line ${event.error.line}`));
            }
        }
    });
}

function displayTrace(trace: any) {
    console.log(chalk.bold('\n Execution Trace\n'));

    if (trace.summary) {
        console.log(chalk.dim(`  Nodes: ${trace.summary.totalNodes}`));
        console.log(chalk.dim(`  Edges: ${trace.summary.totalEdges}`));
        console.log(chalk.dim(`  Errors: ${trace.summary.errorCount}`));
        console.log('');
    }

    if (trace.nodes) {
        for (const node of trace.nodes.slice(0, 20)) {
            const status = node.status === 'error'
                ? chalk.red('error')
                : node.status === 'completed'
                ? chalk.green('done')
                : chalk.yellow('...');

            const duration = node.duration ? `${node.duration}ms` : '';
            console.log(`  [${node.num}] ${chalk.cyan(node.label)} ${status} ${chalk.dim(duration)}`);
        }

        if (trace.nodes.length > 20) {
            console.log(chalk.dim(`  ... and ${trace.nodes.length - 20} more nodes`));
        }
    }
}

function getLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.go': 'go',
        '.rs': 'rust',
        '.rb': 'ruby',
        '.java': 'java'
    };
    return langMap[ext] || 'unknown';
}

async function estimateUploadSize(): Promise<number> {
    try {
        const result = execSync('git ls-files | xargs wc -c | tail -1', {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore']
        });
        return parseInt(result.trim().split(/\s+/)[0]);
    } catch {
        return 0;
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Parse and run
program.parse(process.argv);
