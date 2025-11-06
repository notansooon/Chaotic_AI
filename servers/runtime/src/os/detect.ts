import { execSync } from "child_process";

export type OSFlavor = "linux" | "lima" | "wsl2";
export const detectOS = (): OSFlavor => {
  
    try {
        const output = execSync("uname -a", {stdio: ["ignore", "pipe", "ignore"] }).toString().toLowerCase();
        if (output.includes("darwin")) {
            return ("lima")
        }
        if (output.includes("mircosoft")) {
            return ("wsl2");
        }
         return ("linux");

    }
    catch {
        // Fallback for Windows
        return ("linux");
    }
}
   