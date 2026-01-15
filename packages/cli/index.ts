#!/usr/bin/env node

import { Command } from "commander"
import { execSync } from "child_process"
import fs from "fs/promises"
import chalk from "chalk"
import ora from "ora"
import path from "path"
import os from "os"

// Config file location
const CONFIG_DIR = path.join(os.homedir(), '.kyntrix');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Load config
async function loadConfig(): Promise<{ apiKey?: string; apiUrl?: string }> {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function saveConfig(config: { apiKey?: string; apiUrl?: string }): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Get API URL and key
async function getApiConfig() {
    const config = await loadConfig();
    return {
        apiUrl: process.env.KYNTRIX_API || config.apiUrl || 'http://localhost:3000',
        apiKey: process.env.KYNTRIX_API_KEY || config.apiKey
    };
}

// Get auth headers
async function getAuthHeaders(): Promise<Record<string, string>> {
    const { apiKey } = await getApiConfig();
    if (apiKey) {
        return { 'Authorization': `Bearer ${apiKey}` };
    }
    return {};
}

const program = new Command();

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

program
    .name("kyntrix")
    .description("Execution and Observability Platform for AI Agents")
    .version("0.1.0")

// Login command
program
    .command("login")
    .description("Authenticate with Kyntrix cloud")
    .option('-k, --api-key <key>', 'API key')
    .option('--api-url <url>', 'API URL (default: https://api.kyntrix.io)')
    .action(async (options) => {
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

        const apiUrl = options.apiUrl || 'https://api.kyntrix.io';
        const spinner = ora('Validating API key...').start();

        try {
            const response = await fetch(`${apiUrl}/health`, {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (response.ok) {
                await saveConfig({ apiKey, apiUrl });
                spinner.succeed('Successfully authenticated!');
                console.log(`Config saved to ${chalk.dim(CONFIG_FILE)}`);
            } else {
                spinner.fail('Authentication failed: Invalid API key');
                process.exit(1);
            }
        } catch (err) {
            // Server unreachable, save anyway
            await saveConfig({ apiKey, apiUrl });
            spinner.warn('Could not validate (server unreachable), config saved');
        }
    });

// Config command
program
    .command("config")
    .description("View or update configuration")
    .option('--api-url <url>', 'Set API URL')
    .option('--api-key <key>', 'Set API key')
    .option('--show', 'Show current config')
    .action(async (options) => {
        const config = await loadConfig();

        if (options.apiUrl) {
            config.apiUrl = options.apiUrl;
            await saveConfig(config);
            console.log(chalk.green(`API URL set to: ${options.apiUrl}`));
        }

        if (options.apiKey) {
            config.apiKey = options.apiKey;
            await saveConfig(config);
            console.log(chalk.green('API key updated'));
        }

        if (options.show || (!options.apiUrl && !options.apiKey)) {
            const { apiUrl, apiKey } = await getApiConfig();
            console.log('');
            console.log('Current configuration:');
            console.log(`  API URL: ${chalk.cyan(apiUrl)}`);
            console.log(`  API Key: ${apiKey ? chalk.green(apiKey.slice(0, 12) + '...') : chalk.dim('(not set)')}`);
            console.log(`  Config:  ${chalk.dim(CONFIG_FILE)}`);
            console.log('');
        }
    });

// Whoami command
program
    .command("whoami")
    .description("Show current authentication status")
    .action(async () => {
        const { apiUrl, apiKey } = await getApiConfig();

        if (!apiKey) {
            console.log(chalk.yellow('Not authenticated'));
            console.log('Run: kyntrix login --api-key <your-api-key>');
            return;
        }

        console.log(`Authenticated: ${chalk.green('Yes')}`);
        console.log(`API URL: ${chalk.cyan(apiUrl)}`);
        console.log(`API Key: ${chalk.dim(apiKey.slice(0, 12) + '...')}`);
    });

// Run command
program
    .command("run <file_or_url>")
    .description("Run from local file or git repository")
    .option('--branch <branch>', 'Git branch (default: main)', 'main')
    .option('--commit <sha>', 'Specific commit SHA')
    .option('--force-upload', 'Upload files even if git repo detected')
    .option('-v, --verbose', 'Show detailed trace information')
    .action(async (input, options) => {
        try {
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
            const { apiUrl } = await getApiConfig();
            const authHeaders = await getAuthHeaders();

            const response = await fetch(`${apiUrl}/api/v1/trace/${runId}`, {
                headers: authHeaders
            });
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
                console.log(chalk.cyan('\n📦 Detected git repository'));
                console.log(chalk.dim(`   ${gitInfo.url}@${gitInfo.commit.slice(0, 7)}`));
                
                const fileSize = await estimateUploadSize();
                console.log(chalk.green(`   ⚡ Saved ${formatBytes(fileSize)} upload!\n`));
                
                await executeGitBased(gitInfo, spinner, options);
                return;
            }
        }
        
        // Fallback to file upload
        spinner.text = 'Using file upload mode...';
        console.log(chalk.yellow('\n⚠️  No git repository detected, uploading files'));
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
            console.log(chalk.yellow('\n⚠️  Git repo has uncommitted changes'));
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

    const { apiUrl } = await getApiConfig();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${apiUrl}/runs/start`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders
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

    const { apiUrl } = await getApiConfig();
    const authHeaders = await getAuthHeaders();

    // Original file upload implementation
    const content = await fs.readFile(filePath, 'utf-8');

    const response = await fetch(`${apiUrl}/runs/start`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders
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
    console.log(chalk.cyan(`\n✓ Execution started (${chalk.bold(result.runId)})\n`));
    
    if (result.cache_hit) {
        console.log(chalk.green('⚡ Using cached repository\n'));
    }
    
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
        const { apiUrl } = await getApiConfig();
        const traceUrl = result.trace_url || `${apiUrl}/trace/${result.runId}`;
        console.log(chalk.cyan(`\n🔍 View full trace: ${chalk.underline(traceUrl)}`));
    }
}

function displayTimeline(timeline: TimelineEvent[]) {
    if (!timeline || timeline.length === 0) {
        console.log(chalk.dim('  (no trace data available)'));
        return;
    }
    
    timeline.forEach((event) => {
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