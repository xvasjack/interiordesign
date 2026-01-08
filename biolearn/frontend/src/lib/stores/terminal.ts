import { writable } from 'svelte/store';

// Types
export interface OutputData {
	type: string;
	title: string;
	tool: string;
	summary?: Record<string, string>;
	chartData?: any;
	files?: Array<{ name: string; type: string; size: string }>;
}

export interface TerminalState {
	isRunning: boolean;
	currentCommand: string;
	progress: number;
	estimatedTime: number;
}

// Output panel data - starts empty
export const outputData = writable<OutputData | null>(null);

// Terminal state
export const terminalState = writable<TerminalState>({
	isRunning: false,
	currentCommand: '',
	progress: 0,
	estimatedTime: 0
});

// Command history
export const commandHistory = writable<string[]>([]);

// Tool execution times (in seconds) - realistic estimates
export const toolExecutionTimes: Record<string, { min: number; max: number }> = {
	'seqkit': { min: 2, max: 5 },
	'fastqc': { min: 8, max: 15 },
	'multiqc': { min: 5, max: 10 },
	'trimmomatic': { min: 30, max: 60 },
	'fastp': { min: 20, max: 45 },
	'unicycler': { min: 180, max: 300 },  // 3-5 minutes
	'spades': { min: 180, max: 300 },
	'quast': { min: 15, max: 30 },
	'checkm': { min: 60, max: 120 },
	'confindr': { min: 30, max: 60 },
	'prokka': { min: 60, max: 120 },
	'abricate': { min: 5, max: 15 },
	'mlst': { min: 3, max: 8 },
	'mob_suite': { min: 30, max: 60 },
	'platon': { min: 20, max: 45 },
	'snippy': { min: 60, max: 120 },
	'roary': { min: 120, max: 240 },
	'iqtree': { min: 60, max: 180 },
	'gubbins': { min: 120, max: 300 }
};

// Get random execution time for a tool
export function getExecutionTime(tool: string): number {
	const times = toolExecutionTimes[tool] || { min: 5, max: 15 };
	return Math.floor(Math.random() * (times.max - times.min + 1)) + times.min;
}

// Allowed read-only commands
export const allowedCommands = new Set([
	'ls', 'cat', 'head', 'tail', 'less', 'more',
	'pwd', 'cd', 'echo', 'wc', 'grep', 'find',
	'tree', 'file', 'stat', 'du', 'df'
]);

// Blocked/dangerous commands
export const blockedCommands = new Set([
	'rm', 'mv', 'cp', 'mkdir', 'rmdir', 'touch',
	'chmod', 'chown', 'nano', 'vim', 'vi', 'emacs',
	'wget', 'curl', 'ssh', 'scp', 'rsync',
	'apt', 'yum', 'pip', 'npm', 'sudo', 'su'
]);

// Bioinformatics tools
export const bioTools = new Set([
	'seqkit', 'fastqc', 'multiqc', 'trimmomatic', 'fastp',
	'unicycler', 'spades', 'quast', 'checkm', 'confindr',
	'prokka', 'abricate', 'mlst', 'mob_suite', 'platon',
	'snippy', 'roary', 'iqtree', 'gubbins'
]);
