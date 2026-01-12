import { writable, derived, get } from 'svelte/store';

// Types
export interface OutputData {
	type: string;
	title: string;
	tool: string;
	summary?: Record<string, string>;
	chartData?: any;
	files?: Array<{ name: string; type: string; size: string }>;
	// PDF report specific fields
	isPdfReport?: boolean;
	pdfTitle?: string | null;
	pdfPages?: number | null;
	pdfSize?: string | null;
	pdfSections?: Array<{ title: string; figures: number }> | null;
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

// Stop signal - increment to trigger stop
export const stopSignal = writable<number>(0);

// Track executed commands for dynamic filesystem
export const executedCommands = writable<string[]>([]);

// Track current directory for directory awareness
export const currentDirectory = writable<string>('/data/outbreak_investigation');

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
			description: 'Phred scores (Q) indicate base call accuracy: Q30 = 99.9% accuracy, Q20 = 99% accuracy. Scores above Q30 are excellent; Q20-Q30 is acceptable.',
		},
		{
			name: 'GC Content',
			description: 'Expected GC% varies by organism. For bacteria: 25-75% is normal. ~50% GC is typical for E. coli/Klebsiella. Unexpected GC may indicate contamination.',
		},
		{
			name: 'Adapter Content',
			description: 'Adapter sequences appear when read length exceeds insert size. <5% adapter content is acceptable; higher values require trimming before assembly.',
		},
		{
			name: 'FastQC Report',
			description: 'HTML report showing per-base quality, GC content, adapter contamination, and sequence duplication levels',
			format: '.html'
		}
	],
	'trimmomatic': [
		{
			name: 'Input Reads',
			description: 'Total paired-end read pairs from sequencing. Each pair consists of forward (R1) and reverse (R2) reads from opposite ends of a DNA fragment.',
		},
		{
			name: 'Both Surviving',
			description: 'Read pairs where BOTH R1 and R2 passed quality filters. These are your best quality reads for assembly. >90% retention is good; >95% is excellent.',
		},
		{
			name: 'Forward Only Surviving',
			description: 'R1 (forward read) passed quality thresholds but its R2 partner was discarded due to low quality scores, adapter contamination, or being too short after trimming.',
		},
		{
			name: 'Reverse Only Surviving',
			description: 'R2 (reverse read) passed quality thresholds but its R1 partner was discarded due to low quality scores, adapter contamination, or being too short after trimming.',
		},
		{
			name: 'Dropped',
			description: 'Read pairs where BOTH R1 and R2 failed quality thresholds. Low drop rates (<2%) indicate good sequencing quality.',
		},
		{
			name: 'Quality Trimming',
			description: 'SLIDINGWINDOW:4:15 scans with 4bp window, cuts when average quality drops below Q15. LEADING/TRAILING removes low quality bases from ends.',
		}
	],
	'unicycler': [
		{
			name: 'Assembly Graph',
			description: 'GFA file shows connections between contigs - useful for visualizing repeat regions and resolving complex structures',
			format: '.gfa'
		},
		{
			name: 'Contigs vs Scaffolds',
			description: 'Contigs are contiguous sequences. Unicycler can circularize bacterial chromosomes and plasmids, which is ideal for complete genome assembly.',
			format: '.fasta'
		},
		{
			name: 'N50 Metric',
			description: 'N50 is the length such that 50% of the assembly is in contigs of this length or longer. Higher N50 = better assembly continuity.',
		},
		{
			name: 'GC Content Interpretation',
			description: '52.3% GC is typical for Klebsiella pneumoniae (range: 50-58%). Matching expected GC suggests correct organism and no major contamination.',
		}
	],
	'bandage': [
		{
			name: 'Assembly Graph Visualization',
			description: 'Visual representation of the assembly graph showing how contigs connect. Circular paths indicate complete chromosomes/plasmids.',
		},
		{
			name: 'Dead Ends',
			description: 'Nodes with only one connection. Zero dead ends = complete assembly. Dead ends may indicate incomplete data or repetitive regions.',
		},
		{
			name: 'Graph Quality Assessment',
			description: 'Excellent: 0 dead ends, circular components, clean paths. Good: <5 dead ends. Poor: many dead ends, fragmented graph, tangled regions.',
		},
		{
			name: 'Component Count',
			description: 'Number of separate connected components. For bacteria: expect 1 chromosome + 0-5 plasmids. Many components may indicate fragmentation.',
		}
	],
	'prokka': [
		{
			name: 'GFF3 Annotation',
			description: 'Standard format for genomic features including genes, CDS, rRNA, and tRNA. Can be viewed in genome browsers like IGV.',
			format: '.gff'
		},
		{
			name: 'GenBank Format',
			description: 'Contains sequence + annotations, viewable in tools like Artemis or SnapGene. Standard format for GenBank submissions.',
			format: '.gbk'
		},
		{
			name: 'Annotation Quality',
			description: 'Prokka identifies ~4000-5000 genes in typical bacterial genomes. Check for expected housekeeping genes (dnaA, gyrB, rpoB) as quality control.',
		}
	],
	'abricate': [
		{
			name: 'AMR Genes',
			description: 'Identifies antimicrobial resistance genes by searching against databases like CARD, ResFinder. Critical for clinical microbiology.',
		},
		{
			name: 'Coverage & Identity',
			description: 'Coverage >90% and Identity >90% = high confidence match. Lower values may indicate partial genes or novel variants.',
		},
		{
			name: 'Clinical Interpretation',
			description: 'Presence of resistance genes predicts phenotypic resistance. blaSHV = ampicillin resistance, blaCTX-M = extended-spectrum beta-lactamase (ESBL).',
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
	'bandage': { min: 3, max: 8 },  // Graph visualization
	'quast': { min: 15, max: 30 },
	'checkm': { min: 60, max: 120 },
	'confindr': { min: 30, max: 60 },
	'prokka': { min: 60, max: 120 },
	'bakta': { min: 60, max: 120 },  // Similar to prokka
	'abricate': { min: 5, max: 15 },
	'mlst': { min: 3, max: 8 },
	'mob_recon': { min: 30, max: 60 },
	'platon': { min: 20, max: 45 },
	'snippy': { min: 60, max: 120 },
	'roary': { min: 120, max: 240 },
	'iqtree': { min: 60, max: 180 },
	'gubbins': { min: 120, max: 300 },
	// Long-read tools
	'NanoPlot': { min: 20, max: 45 },
	'filtlong': { min: 15, max: 30 },
	'flye': { min: 180, max: 360 },  // 3-6 minutes
	'medaka_consensus': { min: 120, max: 240 },  // 2-4 minutes
	'porechop': { min: 20, max: 45 },
	'kraken2': { min: 30, max: 60 },
	// Amplicon/16S tools
	'cutadapt': { min: 15, max: 30 },
	'qiime': { min: 30, max: 120 },  // Varies by subcommand
	'biom': { min: 3, max: 8 },
	'sourcetracker2': { min: 60, max: 180 },
	// R/RMarkdown tools
	'Rscript': { min: 5, max: 30 }  // Varies by script complexity
};

// Get random execution time for a tool
export function getExecutionTime(tool: string): number {
	const times = toolExecutionTimes[tool] || { min: 5, max: 15 };
	return Math.floor(Math.random() * (times.max - times.min + 1)) + times.min;
}

// Allowed read-only commands (less/more are NOT available)
export const allowedCommands = new Set([
	'ls', 'cat', 'head', 'tail',
	'pwd', 'cd', 'clear', 'help'
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
	'unicycler', 'spades', 'bandage', 'quast', 'checkm', 'busco', 'confindr',
	'prokka', 'bakta', 'abricate', 'resfinder', 'virulencefinder', 'mlst',
	'mob_recon', 'platon', 'plasmidfinder', 'integron_finder', 'isescan',
	'snippy', 'roary', 'iqtree', 'gubbins',
	// Long-read tools
	'NanoPlot', 'filtlong', 'flye', 'medaka_consensus', 'porechop', 'kraken2',
	// Amplicon/16S tools
	'cutadapt', 'qiime', 'biom', 'sourcetracker2',
	// R/RMarkdown tools
	'Rscript'
]);
