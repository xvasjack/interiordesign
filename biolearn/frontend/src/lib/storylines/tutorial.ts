export interface StorylineSection {
	type: 'intro' | 'context' | 'task' | 'phase' | 'complete' | 'alert' | 'decision' | 'image';
	title?: string;
	text: string;
	command?: string;
	explanation?: string;
	requiredDir?: string | null;
	parameters?: { name: string; desc: string }[];
	hint?: string | null;
	phase?: number;
	imageUrl?: string;
	imageAlt?: string;
	options?: { id: string; label: string; description: string }[];
}

export interface Storyline {
	id: string;
	title: string;
	subtitle: string;
	organism: string;
	technology: 'illumina' | 'pacbio' | 'nanopore' | 'hybrid' | 'r-report' | 'linux-basics';
	technologyLabel: string;
	dataDir: string;
	sections: StorylineSection[];
	toolsUsed: string[];
}

// ============================================
// LINUX BASICS SECTION CREATORS
// ============================================

function createLinuxPhase0Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 0: Getting Started',
			text: 'Learn how to get help and perform basic file operations before diving into bioinformatics.',
			phase: 0
		},
		{
			type: 'context',
			title: 'Welcome to the Terminal',
			text: `Before analyzing sequencing data, you need to be comfortable navigating the Linux command line. This tutorial will teach you essential commands used in bioinformatics workflows.

The terminal is your gateway to powerful data analysis. Let's start by learning how to get help.`
		},
		{
			type: 'task',
			title: 'Step 0a: Get Tool Help',
			text: `Most command-line tools have built-in help. Use the --help flag to see available options for seqkit, a tool you'll use later.`,
			command: 'seqkit --help',
			explanation: 'The --help flag displays usage information, available subcommands, and options for any tool.',
			requiredDir: null,
			parameters: [
				{ name: '--help', desc: 'Display help information' }
			]
		},
		{
			type: 'task',
			title: 'Step 0b: Get Subcommand Help',
			text: `Tools often have subcommands with their own options. Let's see the help for seqkit's stats subcommand.`,
			command: 'seqkit stats --help',
			explanation: 'Subcommands have their own help pages showing specific options for that function.',
			requiredDir: null,
			parameters: [
				{ name: 'stats', desc: 'Subcommand for sequence statistics' },
				{ name: '--help', desc: 'Show stats-specific options' }
			]
		},
		{
			type: 'task',
			title: 'Step 0c: Copy a File',
			text: `Copy files using the cp command. Let's copy a reference file to your working directory.`,
			command: 'cp /data/references/sample_info.txt .',
			explanation: 'The cp command copies files. The dot (.) represents the current directory.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'cp', desc: 'Copy command' },
				{ name: 'source', desc: 'File to copy from' },
				{ name: '.', desc: 'Current directory (destination)' }
			]
		},
		{
			type: 'task',
			title: 'Step 0d: Copy a Directory',
			text: `To copy directories with their contents, use the -r (recursive) flag.`,
			command: 'cp -r /data/references/scripts ./my_scripts',
			explanation: 'The -r flag tells cp to copy directories recursively, including all subdirectories and files.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '-r', desc: 'Recursive copy for directories' },
				{ name: './my_scripts', desc: 'New directory name' }
			]
		}
	];
}

function createLinuxPhase1Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 1: Navigation & Exploration',
			text: 'Master navigating the filesystem - the foundation of all command-line work.',
			phase: 1
		},
		{
			type: 'task',
			title: 'Step 1a: Print Working Directory',
			text: `Find out where you are in the filesystem. The pwd command shows your current location.`,
			command: 'pwd',
			explanation: 'pwd (print working directory) shows the absolute path to your current location.',
			requiredDir: null,
			parameters: [
				{ name: 'pwd', desc: 'Print current directory path' }
			]
		},
		{
			type: 'task',
			title: 'Step 1b: List Directory Contents',
			text: `See what files and directories are in your current location using ls.`,
			command: 'ls',
			explanation: 'ls lists all visible files and directories. Hidden files (starting with .) are not shown by default.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'ls', desc: 'List directory contents' }
			]
		},
		{
			type: 'task',
			title: 'Step 1c: Change Directory',
			text: `Navigate into a subdirectory using cd. Let's go into the sequences folder.`,
			command: 'cd sequences',
			explanation: 'cd (change directory) moves you into the specified directory.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'cd', desc: 'Change directory' },
				{ name: 'sequences', desc: 'Directory to enter' }
			]
		},
		{
			type: 'task',
			title: 'Step 1d: Move Up One Level',
			text: `Go back up one directory using cd .. (two dots represent the parent directory).`,
			command: 'cd ..',
			explanation: 'The .. notation refers to the parent directory, allowing you to move up in the hierarchy.',
			requiredDir: '/data/linux_tutorial/sequences',
			parameters: [
				{ name: '..', desc: 'Parent directory' }
			]
		},
		{
			type: 'task',
			title: 'Step 1e: Return Home',
			text: `Use cd ~ to quickly return to your home directory (the tutorial's starting location).`,
			command: 'cd ~',
			explanation: 'The tilde (~) is a shortcut for your home directory. In this tutorial, it returns you to /data/linux_tutorial.',
			requiredDir: null,
			parameters: [
				{ name: '~', desc: 'Home directory shortcut' }
			]
		}
	];
}

function createLinuxPhase2Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 2: File Inspection',
			text: 'Learn to examine file contents - essential for checking data quality.',
			phase: 2
		},
		{
			type: 'task',
			title: 'Step 2a: View Entire File',
			text: `Use cat to display the complete contents of a small file.`,
			command: 'cat sample_info.txt',
			explanation: 'cat (concatenate) outputs the entire file contents. Use only for small files.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'cat', desc: 'Display file contents' }
			]
		},
		{
			type: 'task',
			title: 'Step 2b: View First Lines',
			text: `For large files, use head to see just the beginning. Let's look at a FASTQ file.`,
			command: 'head sequences/sample_R1.fastq',
			explanation: 'head shows the first 10 lines by default. FASTQ files have 4 lines per read.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'head', desc: 'Show first lines' }
			]
		},
		{
			type: 'task',
			title: 'Step 2c: Specify Line Count',
			text: `Use -n to control how many lines head displays. Let's see exactly 8 lines (2 FASTQ reads).`,
			command: 'head -n 8 sequences/sample_R1.fastq',
			explanation: 'The -n option lets you specify the exact number of lines to show.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '-n 8', desc: 'Show exactly 8 lines' }
			]
		},
		{
			type: 'task',
			title: 'Step 2d: View Last Lines',
			text: `Use tail to see the end of a file. This is useful for checking if a process completed.`,
			command: 'tail sequences/sample_R1.fastq',
			explanation: 'tail shows the last 10 lines. Use -n to change the number, just like head.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'tail', desc: 'Show last lines' }
			]
		},
		{
			type: 'task',
			title: 'Step 2e: Count Lines',
			text: `Use wc (word count) with -l to count lines in a file. For FASTQ files, divide by 4 to get read count.`,
			command: 'wc -l sequences/sample_R1.fastq',
			explanation: 'wc -l counts lines. FASTQ has 4 lines per read, so 40 lines = 10 reads.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'wc', desc: 'Word/line/byte count' },
				{ name: '-l', desc: 'Count lines only' }
			]
		},
		{
			type: 'task',
			title: 'Step 2f: Full Word Count',
			text: `Without flags, wc shows lines, words, and bytes - useful for understanding file size.`,
			command: 'wc sample_info.txt',
			explanation: 'wc outputs three numbers: lines, words, and bytes (characters).',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'wc', desc: 'Show lines, words, bytes' }
			]
		}
	];
}

function createLinuxPhase3Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 3: File Management',
			text: 'Organize your analysis by creating directories for outputs.',
			phase: 3
		},
		{
			type: 'task',
			title: 'Step 3a: Create a Directory',
			text: `Use mkdir to create a new directory for analysis results.`,
			command: 'mkdir results',
			explanation: 'mkdir (make directory) creates a new folder in the current location.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'mkdir', desc: 'Make directory' },
				{ name: 'results', desc: 'New directory name' }
			]
		},
		{
			type: 'task',
			title: 'Step 3b: Create Nested Directories',
			text: `Use -p to create a directory structure with multiple levels at once.`,
			command: 'mkdir -p results/qc/fastqc',
			explanation: 'The -p flag creates parent directories as needed. Without it, mkdir fails if parents don\'t exist.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '-p', desc: 'Create parent directories' },
				{ name: 'results/qc/fastqc', desc: 'Nested path to create' }
			]
		}
	];
}

function createLinuxPhase4Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 4: Text Processing',
			text: 'Search and filter file contents - critical for finding information in large datasets.',
			phase: 4
		},
		{
			type: 'task',
			title: 'Step 4a: Search for Patterns',
			text: `Use grep to find lines containing a specific pattern. Let's find quality scores with 'F' (highest quality).`,
			command: 'grep "FFFFF" sequences/sample_R1.fastq',
			explanation: 'grep searches for text patterns and prints matching lines.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'grep', desc: 'Search for patterns' },
				{ name: '"FFFFF"', desc: 'Pattern to search for' }
			]
		},
		{
			type: 'task',
			title: 'Step 4b: Case-Insensitive Search',
			text: `Use -i to ignore case when searching. Let's find all mentions of "sample" regardless of capitalization.`,
			command: 'grep -i "sample" sample_info.txt',
			explanation: 'The -i flag makes the search case-insensitive (matches SAMPLE, Sample, sample, etc.).',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '-i', desc: 'Ignore case' }
			]
		},
		{
			type: 'task',
			title: 'Step 4c: Count Matches',
			text: `Use -c to count how many lines match a pattern, instead of showing them.`,
			command: 'grep -c "@" sequences/sample_R1.fastq',
			explanation: 'The -c flag counts matching lines. In FASTQ, @ starts each read header, so this counts reads.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '-c', desc: 'Count matching lines' }
			]
		}
	];
}

function createLinuxPhase5Sections(): StorylineSection[] {
	return [
		{
			type: 'phase',
			title: 'Phase 5: Redirection & Wildcards',
			text: 'Save command output to files and work with multiple files efficiently.',
			phase: 5
		},
		{
			type: 'task',
			title: 'Step 5a: Redirect Output to File',
			text: `Use > to save command output to a file instead of displaying it on screen.`,
			command: 'head -n 20 sequences/sample_R1.fastq > results/first_reads.txt',
			explanation: 'The > operator redirects output to a file, creating it if needed or overwriting if it exists.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '>', desc: 'Redirect output (overwrite)' }
			]
		},
		{
			type: 'task',
			title: 'Step 5b: Append to File',
			text: `Use >> to add output to an existing file without overwriting it.`,
			command: 'head -n 20 sequences/sample_R2.fastq >> results/first_reads.txt',
			explanation: 'The >> operator appends to a file, preserving existing content.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '>>', desc: 'Redirect output (append)' }
			]
		},
		{
			type: 'task',
			title: 'Step 5c: Use Wildcards',
			text: `The * wildcard matches any characters. Let's list all FASTQ files at once.`,
			command: 'ls sequences/*.fastq',
			explanation: 'The asterisk (*) matches zero or more characters. *.fastq matches all files ending in .fastq.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: '*', desc: 'Wildcard matching any characters' },
				{ name: '*.fastq', desc: 'All files ending in .fastq' }
			]
		},
		{
			type: 'task',
			title: 'Step 5d: Count Multiple Files',
			text: `Combine wildcards with wc to count lines in multiple files at once.`,
			command: 'wc -l sequences/*.fastq',
			explanation: 'Wildcards expand to all matching files, allowing batch operations.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'sequences/*.fastq', desc: 'All FASTQ files in sequences/' }
			]
		},
		{
			type: 'task',
			title: 'Step 5e: Save Search Results',
			text: `Combine grep with redirection to save search results to a file.`,
			command: 'grep "@" sequences/sample_R1.fastq > results/read_headers.txt',
			explanation: 'This saves all read headers to a file for later analysis or record-keeping.',
			requiredDir: '/data/linux_tutorial',
			parameters: [
				{ name: 'grep "@"', desc: 'Find header lines' },
				{ name: '> results/', desc: 'Save to results directory' }
			]
		}
	];
}

function createLinuxCompletionSection(): StorylineSection[] {
	return [
		{
			type: 'complete',
			title: 'Tutorial Complete!',
			text: `Congratulations! You've mastered the essential Linux commands for bioinformatics:

**Navigation:** pwd, ls, cd
**File Inspection:** cat, head, tail, wc
**File Management:** mkdir, cp
**Text Processing:** grep
**Redirection:** >, >>
**Wildcards:** *

You're now ready to tackle real bioinformatics workflows!`
		}
	];
}

// ============================================
// TUTORIAL STORYLINES
// ============================================

export const storylines: Record<string, Storyline> = {
	'linux-basics': {
		id: 'linux-basics',
		title: 'Linux Command Line Basics',
		subtitle: 'Essential Command Line Skills for Bioinformatics',
		organism: 'N/A',
		technology: 'linux-basics',
		technologyLabel: 'Command Line Fundamentals',
		dataDir: '/data/linux_tutorial',
		sections: [
			{
				type: 'intro',
				title: 'Linux Command Line Essentials',
				text: `Welcome to the Basic Linux Tutorial!

Before diving into bioinformatics analysis, you need to be comfortable with the Linux command line. This tutorial covers the essential commands you'll use daily when working with sequencing data.

**What you'll learn:**
- Getting help with commands
- Navigating the filesystem
- Viewing and inspecting files
- Creating directories
- Searching file contents
- Redirecting output

Let's begin!`
			},
			...createLinuxPhase0Sections(),
			...createLinuxPhase1Sections(),
			...createLinuxPhase2Sections(),
			...createLinuxPhase3Sections(),
			...createLinuxPhase4Sections(),
			...createLinuxPhase5Sections(),
			...createLinuxCompletionSection()
		],
		toolsUsed: ['pwd', 'ls', 'cd', 'cat', 'head', 'tail', 'wc', 'mkdir', 'cp', 'grep']
	},
	'kpneumoniae-demo': {
		id: 'kpneumoniae-demo',
		title: 'Exploring K. pneumoniae',
		subtitle: 'Introduction to WGS Analysis',
		organism: 'Klebsiella pneumoniae',
		technology: 'illumina',
		technologyLabel: 'Illumina NextSeq 2000 (2×150bp)',
		dataDir: '/data/kpneumoniae_demo',
		toolsUsed: ['seqkit', 'fastqc', 'trimmomatic', 'unicycler', 'bandage', 'quast', 'checkm2', 'plasmidfinder', 'abricate', 'mlst', 'prokka'],
		sections: [
			{
				type: 'intro',
				text: `<strong>Welcome to BioLearn WGS Analysis</strong>

In this introductory module, you'll learn the fundamentals of whole-genome sequencing (WGS) analysis using a <em>Klebsiella pneumoniae</em> isolate. This hands-on tutorial will guide you through the complete workflow from raw reads to annotated genome.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `<strong>About <em>Klebsiella pneumoniae</em></strong>

<em>Klebsiella pneumoniae</em> is a common opportunistic, Gram-negative, encapsulated bacterium that is a major cause of hospital-acquired infections including pneumonia, urinary tract infections, and bloodstream infections. It is a critical public health concern due to the emergence of multidrug-resistant (MDR) and hypervirulent strains that are difficult to treat and associated with high mortality rates.

This dataset (SRR36708862) comes from a study investigating antibiotic resistance and virulence profiles of clinical <em>K. pneumoniae</em> strains, helping researchers understand mechanisms of resistance (e.g., blaCTX-M, carbapenemases) and virulence factors (capsule production, fimbriae, siderophores) to inform treatment strategies.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `<strong>Sample Information:</strong>

<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody><tr><td>NCBI Accession</td><td>SRR36708862</td></tr><tr><td>Organism</td><td><em>Klebsiella pneumoniae</em></td></tr><tr><td>Platform</td><td>Illumina NextSeq 2000</td></tr><tr><td>Read Length</td><td>2 × 150 bp (paired-end)</td></tr><tr><td>Expected Genome</td><td>~5.5 Mb</td></tr></tbody></table>

<strong>Learning Objectives:</strong>
<ol><li>Assess raw sequencing data quality</li><li>Trim adapters and low-quality bases</li><li>Assemble reads into contigs</li><li>Evaluate assembly quality</li><li>Screen for antimicrobial resistance genes</li><li>Annotate the genome</li></ol>`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'phase',
				title: 'Phase 1: Quality Control',
				text: 'First, we assess the quality of our raw sequencing data before processing.',
				phase: 1
			},
			{
				type: 'task',
				title: 'Step 1: Check Sequencing Statistics',
				text: `Let's start by examining basic statistics about our sequencing data and save the results to a file.`,
				command: 'seqkit stats SRR36708862_1.fastq.gz SRR36708862_2.fastq.gz > o_seqkit_stats.txt',
				explanation: 'SeqKit provides quick statistics including read count, total bases, and average read length. Output is saved to a file for reference.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'stats', desc: 'Generate sequence statistics' },
					{ name: 'SRR36708862_*.fastq.gz', desc: 'Input paired-end FASTQ files' },
					{ name: '> o_seqkit_stats.txt', desc: 'Redirect output to file' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: View Statistics Results',
				text: `Now let's view the sequencing statistics we just generated.`,
				command: 'cat o_seqkit_stats.txt',
				explanation: 'This sample was sequenced as 2×150 bp paired-end on Illumina NextSeq 2000. You may notice a max read length of ~300 bp—this is because overlapping R1 and R2 reads were merged during pre-processing before we downloaded the data. For this tutorial, we are using these pre-processed FASTQ files.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'cat', desc: 'Concatenate and display file contents' },
					{ name: 'o_seqkit_stats.txt', desc: 'The statistics output file' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Quality Control Report',
				text: `Generate detailed quality reports to identify any issues with the sequencing data.`,
				command: 'fastqc SRR36708862_1.fastq.gz SRR36708862_2.fastq.gz -o o_fastqc/',
				explanation: 'FastQC analyzes per-base quality scores, GC content, adapter contamination, and other quality metrics.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '-o o_fastqc/', desc: 'Output directory for reports' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 2: Read Preprocessing',
				text: 'Clean the raw reads by removing adapters and low-quality bases.',
				phase: 2
			},
			{
				type: 'task',
				title: 'Step 4: Adapter Trimming',
				text: `Remove Illumina adapters and trim low-quality bases from read ends.`,
				command: 'trimmomatic PE -threads 2 -phred33 SRR36708862_1.fastq.gz SRR36708862_2.fastq.gz o_trimmomatic/SRR36708862_R1_paired.fq.gz o_trimmomatic/SRR36708862_R1_unpaired.fq.gz o_trimmomatic/SRR36708862_R2_paired.fq.gz o_trimmomatic/SRR36708862_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Trimmomatic removes adapter sequences and trims bases with quality below threshold.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'PE', desc: 'Paired-end mode' },
					{ name: '-threads 2', desc: 'Use 2 CPU threads' },
					{ name: '-phred33', desc: 'Use Phred+33 quality encoding (standard for Illumina 1.8+)' },
					{ name: 'ILLUMINACLIP', desc: 'Remove TruSeq adapters' },
					{ name: 'SLIDINGWINDOW:4:15', desc: 'Trim when 4-base average quality < 15' },
					{ name: 'MINLEN:36', desc: 'Discard reads shorter than 36 bp' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 3: Genome Assembly',
				text: 'Assemble the cleaned reads into contiguous sequences (contigs).',
				phase: 3
			},
			{
				type: 'task',
				title: 'Step 5: De Novo Assembly',
				text: `Assemble the trimmed reads into contigs using Unicycler.`,
				command: 'unicycler -1 o_trimmomatic/SRR36708862_R1_paired.fq.gz -2 o_trimmomatic/SRR36708862_R2_paired.fq.gz -o o_unicycler/',
				explanation: 'Unicycler uses SPAdes with multiple k-mer sizes and optimizes the assembly graph.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '-1/-2', desc: 'Forward and reverse paired reads' },
					{ name: '-o o_unicycler/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 6: Visualize Assembly Graph',
				text: `Create a visual representation of the assembly graph to understand genome structure.`,
				command: 'bandage image o_unicycler/assembly.gfa o_bandage.png',
				explanation: 'Bandage visualizes the assembly graph showing how contigs connect.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'image', desc: 'Generate PNG image' },
					{ name: 'o_unicycler/assembly.gfa', desc: 'Input graph file' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 4: Assembly Quality Assessment',
				text: 'Evaluate the quality and completeness of the assembled genome.',
				phase: 4
			},
			{
				type: 'task',
				title: 'Step 7: Assembly Metrics',
				text: `Calculate assembly statistics including N50, total length, and contig count.`,
				command: 'quast o_unicycler/assembly.fasta -o o_quast/',
				explanation: 'QUAST calculates key assembly metrics to assess quality.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'o_unicycler/assembly.fasta', desc: 'Input assembly file' },
					{ name: '-o o_quast/', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 8: Genome Completeness',
				text: `Assess genome completeness and contamination using CheckM2.`,
				command: 'checkm2 predict --input o_unicycler/ --output-directory o_checkm2/ -x fasta',
				explanation: 'CheckM2 uses machine learning to estimate completeness and contamination.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '--input o_unicycler/', desc: 'Directory with assembly' },
					{ name: '--output-directory o_checkm2/', desc: 'Output directory' },
					{ name: '-x fasta', desc: 'File extension' }
				]
			},
			{
				type: 'task',
				title: 'Step 9: Plasmid Identification',
				text: `Identify plasmid replicons in the assembly to confirm which circular components are plasmids.`,
				command: 'plasmidfinder.py -i o_unicycler/assembly.fasta -x -o o_plasmidfinder',
				explanation: 'PlasmidFinder searches for known plasmid replicon sequences in the assembly to identify plasmid types.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '-i', desc: 'Input assembly file' },
					{ name: '-o', desc: 'Output directory' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 5: AMR Screening & Typing',
				text: 'Screen for antimicrobial resistance genes and determine sequence type.',
				phase: 5
			},
			{
				type: 'task',
				title: 'Step 10: AMR Gene Detection',
				text: `Screen the assembly for antimicrobial resistance genes using multiple databases.`,
				command: 'abricate --db ncbi o_unicycler/assembly.fasta -o o_abricate/',
				explanation: 'ABRicate rapidly screens for resistance genes against curated databases.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '--db ncbi', desc: 'Use NCBI AMRFinder database' },
					{ name: '-o', desc: 'Output directory' }
				]
			},
			{
				type: 'task',
				title: 'Step 11: MLST Typing',
				text: `Determine the sequence type (ST) for epidemiological classification.`,
				command: 'mlst o_unicycler/assembly.fasta > o_mlst/mlst_result.tab',
				explanation: 'MLST identifies the allelic profile of 7 housekeeping genes to assign a sequence type.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: 'o_unicycler/assembly.fasta', desc: 'Input assembly file' },
					{ name: '> o_mlst/mlst_result.tab', desc: 'Redirect output to file' }
				]
			},
			{
				type: 'phase',
				title: 'Phase 6: Genome Annotation',
				text: 'Identify and annotate genes in the assembled genome.',
				phase: 6
			},
			{
				type: 'task',
				title: 'Step 12: Gene Annotation',
				text: `Annotate the genome to identify coding sequences, tRNAs, and rRNAs.`,
				command: 'prokka --outdir o_prokka --prefix PROKKA o_unicycler/assembly.fasta',
				explanation: 'Prokka performs rapid prokaryotic genome annotation.',
				requiredDir: '/data/kpneumoniae_demo',
				parameters: [
					{ name: '--outdir o_prokka', desc: 'Output directory' },
					{ name: '--prefix PROKKA', desc: 'Output file prefix' },
					{ name: 'o_unicycler/assembly.fasta', desc: 'Input assembly file' }
				]
			},
			{
				type: 'complete',
				title: 'Tutorial Complete!',
				text: `**Congratulations!** You've completed the WGS analysis tutorial.\n\n---\n\n**Your Results Summary:**\n\n| Metric | Value |\n|--------|-------|\n| Input Reads | 990,478 pairs |\n| After Trimming | 982,838 pairs (99.23%) |\n| Assembly Size | 5,564,255 bp |\n| Contigs | 117 |\n| N50 | 371,705 bp |\n| GC Content | 57.18% |\n| Completeness | 100.0% |\n| Contamination | 0.16% |\n\n**Sequence Type:** ST307 (Klebsiella pneumoniae)\n\n**AMR Genes Detected:**\n• blaKPC-2 (carbapenemase)\n• blaSHV-11 (β-lactamase)\n• oqxA/oqxB (fluoroquinolone efflux)\n• fosA (fosfomycin resistance)\n\n**Annotation Summary:**\n• 5,174 coding sequences (CDS)\n• 77 tRNAs\n• 6 rRNAs\n• 1 tmRNA\n\n---\n\n**What's Next?**\nTry the **Hospital Outbreak Investigation** scenario to apply these skills to a real-world epidemiological investigation with multiple samples!`
			}
		]
	}
};

export function getStoryline(id: string): Storyline | undefined {
	return storylines[id];
}

export function getStorylinesList(): { id: string; title: string; subtitle: string; technology: string; technologyLabel: string }[] {
	return Object.values(storylines).map(s => ({
		id: s.id,
		title: s.title,
		subtitle: s.subtitle,
		technology: s.technology,
		technologyLabel: s.technologyLabel
	}));
}
