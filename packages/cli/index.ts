import { Command } from "commander"
import fs from "fs/promises"
import chalk from "chalk"
import ora from "ora"
import { glob } from "glob"
import path from "path"
import { error } from "console"

// CONFIG: Point this to your instance-manager URL
const API_URL = process.env.KYNTRIX_API || 'http://localhost:3000';
const program = new Command();


program
    .name("Kyntrix")
    .description("AI Nervous System")
    .version("0.0.1")


program
    .command("run <file_name>")
    .description("Run a script securely and get an execution graph")
    .action(async (entryFile) => {

        if (!fs.existsSync(entryFile)) {
            console.error(chalk.red(`❌ File not found: ${entryFile}`))
            process.exit(1)
        }


        const spinner = ora("loading unicorn").start()

        try {
            const filePath = await glob("**/*", {
                ignore: ['node_modules/**', '.git/**', '.env', 'dist/**'],
                nodir: true
            })


            const fileMap: Record<string, string> = {};


            for (const fp of filePath) {

                if (isTextFile(fp)) {
                    const content = await fs.readFile(fp, 'utf-8');
                    fileMap[fp] = content;
                }

            }


            const response = await fetch(`${API_URL}/runs/start`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entry_point: entryFile,
                    files: fileMap,
                    language: getLanguage(entryFile)
                })

            })


            if (!response.ok) {
               throw new Error(`Server Error: ${response.status} ${response.statusText}`)
            }


            const result = await response.json()

            spinner.stop()

            if response.


        }
        catch(error) {

        }

    })

function getLanguage(filename: string) {
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.js') || filename.endsWith('.ts')) return 'node';
    return 'unknown';
}
function isTextFile(file: string) {
    const ext = path.extname(file)
    return !['.png', '.jpg', '.exe', '.bin', '.pyc'].includes(ext);

}