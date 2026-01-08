import { writable, derived, get } from 'svelte/store';

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

export interface FileNote {
	name: string;
	description: string;
	format?: string;
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

// Track executed commands for dynamic filesystem
export const executedCommands = writable<string[]>([]);

// Track current step in story (for hiding next steps)
export const currentStoryStep = writable<number>(0);
export const executedSteps = writable<Set<number>>(new Set());

// Command history
export const commandHistory = writable<string[]>([]);

// File notes/descriptions for Notes tab
export const fileNotes: Record<string, FileNote[]> = {
	'fastqc': [
		{
			name: 'FASTQ Format',
			description: 'FASTQ files contain 4 lines per read: @header, sequence, +, quality scores (Phred+33 encoded)',
			format: '.fastq.gz'
		},
		{
			name: 'Quality Scores',
			description: 'Phred scores (Q) indicate base call accuracy: Q30 = 99.9% accuracy, Q20 = 99% accuracy',
		},
		{
			name: 'FastQC Report',
			description: 'HTML report showing per-base quality, GC content, adapter contamination, and sequence duplication levels',
			format: '.html'
		}
	],
	'trimmomatic': [
		{
			name: 'Adapter Trimming',
			description: 'Removes Illumina adapter sequences that can interfere with downstream analysis',
		},
		{
			name: 'Quality Trimming',
			description: 'SLIDINGWINDOW:4:15 means scan with 4bp window, cut when average quality < 15',
		},
		{
			name: 'Paired Output',
			description: 'Both R1 and R2 must survive trimming to be in "paired" output files',
			format: '_paired.fq.gz'
		}
	],
	'unicycler': [
		{
			name: 'Assembly Graph',
			description: 'GFA file shows connections between contigs - useful for visualizing repeat regions',
			format: '.gfa'
		},
		{
			name: 'Contigs vs Scaffolds',
			description: 'Contigs are contiguous sequences. Unicycler can circularize bacterial chromosomes and plasmids',
			format: '.fasta'
		},
		{
			name: 'N50 Metric',
			description: 'N50 is the length such that 50% of the assembly is in contigs of this length or longer',
		}
	],
	'prokka': [
		{
			name: 'GFF3 Annotation',
			description: 'Standard format for genomic features including genes, CDS, rRNA, and tRNA',
			format: '.gff'
		},
		{
			name: 'GenBank Format',
			description: 'Contains sequence + annotations, viewable in tools like Artemis or SnapGene',
			format: '.gbk'
		}
	],
	'abricate': [
		{
			name: 'AMR Genes',
			description: 'Identifies antimicrobial resistance genes by searching against databases like CARD, ResFinder',
		},
		{
			name: 'Coverage & Identity',
			description: 'Higher % coverage and identity = more confident match to known resistance gene',
		}
	]
};

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
