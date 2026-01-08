<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { outputData, terminalState, toolExecutionTimes, allowedCommands, blockedCommands, bioTools, executedCommands, executedSteps, currentDirectory } from '$lib/stores/terminal';
	import { get } from 'svelte/store';

	let terminalContainer: HTMLDivElement;
	let terminal: any;
	let fitAddon: any;
	let resizeObserver: ResizeObserver;
	let commandBuffer = '';
	let cursorPosition = 0;  // Track cursor position for left/right arrow
	let isExecuting = false;
	let currentDir = '/data/outbreak_investigation';

	// Command history for arrow up/down
	let commandHistoryList: string[] = [];
	let historyIndex = -1;
	let savedCurrentBuffer = '';

	// Allowed commands for dropdown display
	const allowedCommandsList = [
		'ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'clear', 'help'
	];

	// Track which tools have been run for dynamic filesystem
	let executedToolsList: string[] = [];
	executedCommands.subscribe(cmds => executedToolsList = cmds);

	// Base filesystem - sequencing data files exist at start (from sequencer)
	const baseFilesystem: Record<string, string[]> = {
		'/data/outbreak_investigation': [
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz',
			'sample_02_R1.fastq.gz', 'sample_02_R2.fastq.gz',
			'sample_03_R1.fastq.gz', 'sample_03_R2.fastq.gz'
		]
	};

	// Files created by each tool
	const toolCreatedFiles: Record<string, Record<string, string[]>> = {
		'fastqc': {
			'/data/outbreak_investigation': ['qc_reports/'],
			'/data/outbreak_investigation/qc_reports': [
				'sample_01_R1_fastqc.html', 'sample_01_R1_fastqc.zip',
				'sample_01_R2_fastqc.html', 'sample_01_R2_fastqc.zip'
			]
		},
		'trimmomatic': {
			'/data/outbreak_investigation': ['trimmed/'],
			'/data/outbreak_investigation/trimmed': [
				'sample_01_R1_paired.fq.gz', 'sample_01_R2_paired.fq.gz',
				'sample_01_R1_unpaired.fq.gz', 'sample_01_R2_unpaired.fq.gz'
			]
		},
		'unicycler': {
			'/data/outbreak_investigation': ['assembly/'],
			'/data/outbreak_investigation/assembly': [
				'assembly.fasta', 'assembly.gfa', 'unicycler.log'
			]
		},
		'bandage': {
			'/data/outbreak_investigation/assembly': [
				'assembly_graph.png'
			]
		},
		'prokka': {
			'/data/outbreak_investigation': ['annotation/'],
			'/data/outbreak_investigation/annotation': [
				'sample_01.gff', 'sample_01.gbk', 'sample_01.fna',
				'sample_01.faa', 'sample_01.ffn', 'sample_01.txt'
			]
		},
		'abricate': {
			'/data/outbreak_investigation': ['results/'],
			'/data/outbreak_investigation/results': [
				'amr_report.tsv', 'amr_summary.txt'
			]
		},
		'quast': {
			'/data/outbreak_investigation/assembly': [
				'quast_report.html', 'quast_report.tsv'
			]
		}
	};

	// Get dynamic filesystem based on executed commands
	function getFilesystem(): Record<string, string[]> {
		const fs: Record<string, string[]> = {};

		// Start with base filesystem
		for (const [path, files] of Object.entries(baseFilesystem)) {
			fs[path] = [...files];
		}

		// Add files from executed tools
		for (const tool of executedToolsList) {
			const created = toolCreatedFiles[tool];
			if (created) {
				for (const [path, files] of Object.entries(created)) {
					if (!fs[path]) fs[path] = [];
					for (const file of files) {
						if (!fs[path].includes(file)) {
							fs[path].push(file);
						}
					}
				}
			}
		}

		return fs;
	}

	// Generate dynamic tool output based on input file
	function getToolOutput(tool: string, args: string[], fullCmd: string): any {
		// Extract input file from command
		const inputFile = args.find(a => a.endsWith('.fastq.gz') || a.endsWith('.fq.gz')) || 'sample_01_R1.fastq.gz';
		const isR2 = inputFile.includes('R2');
		const sampleMatch = inputFile.match(/sample_(\d+)/);
		const sampleNum = sampleMatch ? sampleMatch[1] : '01';
		const sampleName = `sample_${sampleNum}`;

		// Different stats for different samples/reads
		const baseReads = 2456789;
		const sampleVariation = parseInt(sampleNum) * 12345;
		const totalReads = baseReads + (sampleVariation % 50000);
		const gcContent = isR2 ? 51.8 : 52.3;
		const adapterPercent = isR2 ? 2.8 : 3.2;

		const outputs: Record<string, any> = {
			'seqkit': {
				output: `\x1b[32m[INFO]\x1b[0m Processing ${inputFile}...
file                      format  type   num_seqs      sum_len  min_len  avg_len  max_len
${inputFile.padEnd(25)} FASTQ   DNA    ${totalReads.toLocaleString()}  ${(totalReads * 150).toLocaleString()}      150      150      150

\x1b[32m[INFO]\x1b[0m Summary Statistics:
  Total reads:     ${totalReads.toLocaleString()}
  Total bases:     ${(totalReads * 150).toLocaleString()}
  GC content:      ${gcContent}%
  Q20 bases:       97.2%
  Q30 bases:       93.8%
`,
				summary: {
					'File': inputFile,
					'Total Reads': totalReads.toLocaleString(),
					'Total Bases': `${(totalReads * 150 / 1000000).toFixed(1)} Mb`,
					'Read Length': '150 bp',
					'GC Content': `${gcContent}%`,
					'Q20 Bases': '97.2%',
					'Q30 Bases': '93.8%'
				},
				files: [{ name: 'seqkit_stats.txt', type: 'txt', size: '1.2 KB' }]
			},
			'fastqc': {
				output: `Started analysis of ${inputFile}
Approx 5% complete for ${inputFile}
Approx 15% complete for ${inputFile}
Approx 30% complete for ${inputFile}
Approx 50% complete for ${inputFile}
Approx 70% complete for ${inputFile}
Approx 85% complete for ${inputFile}
Approx 95% complete for ${inputFile}
Analysis complete for ${inputFile}
`,
				summary: {
					'File': inputFile,
					'Total Sequences': totalReads.toLocaleString(),
					'Sequence Length': '150 bp',
					'GC Content': `${gcContent}%`,
					'Per Base Quality': 'PASS',
					'Adapter Content': `WARNING (${adapterPercent}%)`,
					'Overall Quality': 'PASS'
				},
				chartData: {
					title: `Per Base Sequence Quality - ${inputFile}`,
					positions: Array.from({ length: 150 }, (_, i) => i + 1),
					scores: Array.from({ length: 150 }, (_, i) => {
						const base = isR2 ? 31 : 32;
						const seed = (i * 7 + parseInt(sampleNum) * 13) % 100;
						return base + (seed / 100) * 6 - (i > 130 ? (i - 130) * 0.3 : 0);
					}),
					xLabel: 'Position in read (bp)',
					yLabel: 'Quality Score (Phred)'
				},
				files: [
					{ name: `${sampleName}_${isR2 ? 'R2' : 'R1'}_fastqc.html`, type: 'html', size: '245 KB' },
					{ name: `${sampleName}_${isR2 ? 'R2' : 'R1'}_fastqc.zip`, type: 'zip', size: '1.2 MB' }
				]
			},
			'trimmomatic': {
				// Fixed math: 2,456,789 = 2,394,012 + 34,567 + 19,876 + 8,334 = 2,456,789 ✓
				output: `TrimmomaticPE: Started with arguments:
 -phred33 ${sampleName}_R1.fastq.gz ${sampleName}_R2.fastq.gz ...
Using PrefixPair: 'TACACTCTTTCCCTACACGACGCTCTTCCGATCT' and 'GTGACTGGAGTTCAGACGTGTGCTCTTCCGATCT'
ILLUMINACLIP: Using 1 prefix pairs, 2 forward/reverse sequences
Quality encoding detected as phred33
Input Read Pairs: 2,456,789
  Both Surviving: 2,394,012 (97.44%)
  Forward Only Surviving: 34,567 (1.41%)
  Reverse Only Surviving: 19,876 (0.81%)
  Dropped: 8,334 (0.34%)
TrimmomaticPE: Completed successfully
`,
				summary: {
					'Input Reads': '2,456,789 pairs',
					'Both Surviving': '2,394,012 (97.44%)',
					'Forward Only': '34,567 (1.41%)',
					'Reverse Only': '19,876 (0.81%)',
					'Dropped': '8,334 (0.34%)'
				},
				chartData: {
					title: 'Trimmomatic Read Retention',
					x: ['Both Surviving', 'Forward Only', 'Reverse Only', 'Dropped'],
					y: [2394012, 34567, 19876, 8334],
					type: 'bar',
					xLabel: 'Read Category',
					yLabel: 'Number of Reads'
				},
				files: [
					{ name: `${sampleName}_R1_paired.fq.gz`, type: 'fastq', size: '342 MB' },
					{ name: `${sampleName}_R2_paired.fq.gz`, type: 'fastq', size: '341 MB' },
					{ name: `${sampleName}_R1_unpaired.fq.gz`, type: 'fastq', size: '4.8 MB' },
					{ name: `${sampleName}_R2_unpaired.fq.gz`, type: 'fastq', size: '2.7 MB' }
				]
			},
			'unicycler': {
				output: `
\x1b[1;32m _    _       _                  _
| |  | |     (_)                | |
| |  | |_ __  _  ___ _   _  ____| | ___ _ __
| |  | | '_ \\| |/ __| | | |/ __| |/ _ \\ '__|
| |__| | | | | | (__| |_| | (__| |  __/ |
 \\____/|_| |_|_|\\___|\\__, |\\___|_|\\___|_|
                      __/ |
                     |___/\x1b[0m

Starting Unicycler v0.5.0

\x1b[36mChecking dependencies...\x1b[0m
  SPAdes: 3.15.5 ✓
  Racon: 1.5.0 ✓
  Bowtie2: 2.4.5 ✓
  Samtools: 1.17 ✓

\x1b[36mLoading reads...\x1b[0m
  Forward reads: 2,394,012
  Reverse reads: 2,394,012

\x1b[36mPerforming SPAdes assembly...\x1b[0m
  k=27: 1,234 contigs
  k=47: 856 contigs
  k=63: 423 contigs
  k=77: 245 contigs
  k=89: 128 contigs
  k=99: 67 contigs

\x1b[36mBuilding assembly graph...\x1b[0m
  Nodes: 847
  Edges: 1,203

\x1b[36mRotating circular sequences...\x1b[0m
  \x1b[32mChromosome: circularized (4,892,156 bp)\x1b[0m
  \x1b[32mPlasmid 1: circularized (95,234 bp)\x1b[0m

\x1b[36mPolishing assembly...\x1b[0m
  Round 1: 23 corrections
  Round 2: 3 corrections
  Round 3: 0 corrections

\x1b[1;32mAssembly complete!\x1b[0m

Final assembly:
  Contigs: 2
  Total length: 4,987,390 bp
  Largest contig: 4,892,156 bp
  N50: 4,892,156 bp
  GC content: 52.3%

\x1b[33mTip: Use 'bandage image assembly.gfa assembly_graph.png' to visualize the assembly graph\x1b[0m
`,
				summary: {
					'Total Contigs': '2',
					'Total Length': '4,987,390 bp',
					'Largest Contig': '4,892,156 bp',
					'N50': '4,892,156 bp',
					'GC Content': '52.3%',
					'Circular': '2 (chromosome + plasmid)'
				},
				chartData: {
					title: 'Contig Length Distribution',
					x: ['Chromosome', 'Plasmid_1'],
					y: [4892156, 95234],
					type: 'bar',
					xLabel: 'Contig',
					yLabel: 'Length (bp)'
				},
				files: [
					{ name: 'assembly.fasta', type: 'fasta', size: '4.8 MB' },
					{ name: 'assembly.gfa', type: 'gfa', size: '12 MB' },
					{ name: 'unicycler.log', type: 'log', size: '156 KB' }
				]
			},
			'bandage': {
				output: `\x1b[36mBandage v0.8.1\x1b[0m
Loading assembly graph: assembly.gfa
  Nodes loaded: 847
  Edges loaded: 1,203

\x1b[36mGenerating visualization...\x1b[0m
  Layout algorithm: Force-directed
  Node coloring: By depth

\x1b[32m✓ Graph visualization saved\x1b[0m
  Output: assembly_graph.png (2048x2048 px)

\x1b[33mGraph Statistics:\x1b[0m
  Connected components: 2
  Largest component: Chromosome (4.89 Mb)
  Circular contigs: 2
  Dead ends: 0
`,
				summary: {
					'Nodes': '847',
					'Edges': '1,203',
					'Components': '2',
					'Circular Contigs': '2',
					'Dead Ends': '0',
					'Layout': 'Force-directed',
					'Quality': 'Excellent (complete circular genome)'
				},
				chartData: {
					title: 'Assembly Graph - Component Sizes',
					x: ['Chromosome', 'Plasmid 1'],
					y: [4892156, 95234],
					type: 'bar',
					xLabel: 'Component',
					yLabel: 'Size (bp)',
					isAssemblyGraph: true,
					graphStats: {
						components: 2,
						circular: 2,
						deadEnds: 0,
						quality: 'excellent'
					}
				},
				files: [
					{ name: 'assembly_graph.png', type: 'png', size: '1.8 MB' }
				]
			}
		};

		return outputs[tool] || null;
	}

	const terminalOptions = {
		theme: {
			background: '#1e1e1e',
			foreground: '#d4d4d4',
			cursor: '#d4d4d4',
			cursorAccent: '#1e1e1e',
			selectionBackground: '#264f78',
			black: '#1e1e1e',
			red: '#f44747',
			green: '#4ec9b0',
			yellow: '#dcdcaa',
			blue: '#569cd6',
			magenta: '#c586c0',
			cyan: '#9cdcfe',
			white: '#d4d4d4',
			brightBlack: '#808080',
			brightRed: '#f44747',
			brightGreen: '#4ec9b0',
			brightYellow: '#dcdcaa',
			brightBlue: '#569cd6',
			brightMagenta: '#c586c0',
			brightCyan: '#9cdcfe',
			brightWhite: '#ffffff'
		},
		fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
		fontSize: 14,
		lineHeight: 1.2,
		cursorBlink: true,
		cursorStyle: 'block' as const,
		scrollback: 10000
	};

	function writePrompt() {
		const shortDir = currentDir.replace('/data/outbreak_investigation', '~');
		terminal.write(`\r\n\x1b[32mbiolearn\x1b[0m:\x1b[34m${shortDir}\x1b[0m$ `);
	}

	function clearLine() {
		// Clear current line
		const len = commandBuffer.length;
		for (let i = 0; i < len; i++) {
			terminal.write('\b \b');
		}
	}

	function handleInput(data: string) {
		if (isExecuting) return;

		// Handle Enter
		if (data === '\r') {
			terminal.write('\r\n');
			if (commandBuffer.trim()) {
				// Add to history
				commandHistoryList.push(commandBuffer.trim());
				historyIndex = -1;
				savedCurrentBuffer = '';
				executeCommand(commandBuffer.trim());
			} else {
				writePrompt();
			}
			commandBuffer = '';
			cursorPosition = 0;
		}
		// Handle Backspace
		else if (data === '\x7f') {
			if (cursorPosition > 0) {
				// Delete character before cursor
				commandBuffer = commandBuffer.slice(0, cursorPosition - 1) + commandBuffer.slice(cursorPosition);
				cursorPosition--;
				// Redraw line from cursor position
				terminal.write('\b');
				terminal.write(commandBuffer.slice(cursorPosition) + ' ');
				// Move cursor back to position
				for (let i = 0; i <= commandBuffer.length - cursorPosition; i++) {
					terminal.write('\b');
				}
			}
		}
		// Handle Ctrl+C
		else if (data === '\x03') {
			terminal.write('^C');
			commandBuffer = '';
			cursorPosition = 0;
			historyIndex = -1;
			isExecuting = false;
			terminalState.set({ isRunning: false, currentCommand: '', progress: 0, estimatedTime: 0 });
			writePrompt();
		}
		// Handle Ctrl+L (clear screen)
		else if (data === '\x0c') {
			terminal.clear();
			writePrompt();
			terminal.write(commandBuffer);
			cursorPosition = commandBuffer.length;
		}
		// Handle Tab autocomplete
		else if (data === '\t') {
			handleTabComplete();
		}
		// Handle Arrow keys (escape sequences)
		else if (data === '\x1b[A') {
			// Arrow Up - previous command
			if (commandHistoryList.length > 0) {
				if (historyIndex === -1) {
					savedCurrentBuffer = commandBuffer;
					historyIndex = commandHistoryList.length - 1;
				} else if (historyIndex > 0) {
					historyIndex--;
				}
				clearLine();
				commandBuffer = commandHistoryList[historyIndex];
				cursorPosition = commandBuffer.length;
				terminal.write(commandBuffer);
			}
		}
		else if (data === '\x1b[B') {
			// Arrow Down - next command
			if (historyIndex !== -1) {
				if (historyIndex < commandHistoryList.length - 1) {
					historyIndex++;
					clearLine();
					commandBuffer = commandHistoryList[historyIndex];
					cursorPosition = commandBuffer.length;
					terminal.write(commandBuffer);
				} else {
					historyIndex = -1;
					clearLine();
					commandBuffer = savedCurrentBuffer;
					cursorPosition = commandBuffer.length;
					terminal.write(commandBuffer);
				}
			}
		}
		// Arrow Left - move cursor left
		else if (data === '\x1b[D') {
			if (cursorPosition > 0) {
				cursorPosition--;
				terminal.write('\x1b[D');  // Move cursor left
			}
		}
		// Arrow Right - move cursor right
		else if (data === '\x1b[C') {
			if (cursorPosition < commandBuffer.length) {
				cursorPosition++;
				terminal.write('\x1b[C');  // Move cursor right
			}
		}
		// Regular characters
		else if (data >= ' ') {
			// Insert character at cursor position
			commandBuffer = commandBuffer.slice(0, cursorPosition) + data + commandBuffer.slice(cursorPosition);
			cursorPosition++;
			// Write from cursor position to end
			terminal.write(commandBuffer.slice(cursorPosition - 1));
			// Move cursor back to position
			for (let i = 0; i < commandBuffer.length - cursorPosition; i++) {
				terminal.write('\b');
			}
		}
	}

	function handleTabComplete() {
		const parts = commandBuffer.split(/\s+/);
		const lastPart = parts[parts.length - 1] || '';
		const command = parts[0] || '';

		// Don't allow tab completion for non-existent commands
		const validCommands = [...allowedCommandsList, ...Array.from(bioTools)];
		if (parts.length > 1 && !validCommands.includes(command)) {
			return; // Don't tab complete for invalid commands
		}

		// Get current filesystem
		const filesystem = getFilesystem();

		// Handle subdirectory paths (e.g., trimmed/sample)
		let searchDir = currentDir;
		let searchPrefix = lastPart;
		let pathPrefix = '';

		if (lastPart.includes('/')) {
			const lastSlash = lastPart.lastIndexOf('/');
			const dirPart = lastPart.slice(0, lastSlash);
			searchPrefix = lastPart.slice(lastSlash + 1);
			pathPrefix = dirPart + '/';

			// Resolve the directory path
			if (dirPart.startsWith('/')) {
				searchDir = dirPart;
			} else {
				searchDir = `${currentDir}/${dirPart}`.replace(/\/+/g, '/');
			}
		}

		const files = filesystem[searchDir] || [];

		// Find matches
		const matches = files.filter(f => f.startsWith(searchPrefix));

		if (matches.length === 0) {
			return; // No matches
		} else if (matches.length === 1) {
			// Single match - complete it
			const completion = matches[0].slice(searchPrefix.length);
			commandBuffer += completion;
			cursorPosition += completion.length;
			terminal.write(completion);
		} else {
			// Multiple matches - show them
			terminal.write('\r\n');
			const formatted = matches.map(f => {
				if (f.endsWith('/')) return `\x1b[34m${f}\x1b[0m`;
				if (f.endsWith('.gz') || f.endsWith('.fastq') || f.endsWith('.fasta')) return `\x1b[32m${f}\x1b[0m`;
				return f;
			});
			terminal.writeln(formatted.join('  '));
			writePrompt();
			terminal.write(commandBuffer);
			cursorPosition = commandBuffer.length;

			// Find common prefix
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > searchPrefix.length) {
				const completion = commonPrefix.slice(searchPrefix.length);
				commandBuffer += completion;
				cursorPosition += completion.length;
				terminal.write(completion);
			}
		}
	}

	function findCommonPrefix(strings: string[]): string {
		if (strings.length === 0) return '';
		let prefix = strings[0];
		for (let i = 1; i < strings.length; i++) {
			while (!strings[i].startsWith(prefix)) {
				prefix = prefix.slice(0, -1);
			}
		}
		return prefix;
	}

	// Tool requirements: directory and required files
	const toolRequirements: Record<string, { dir: string; requiredFiles?: string[]; checkFile?: (f: string) => boolean }> = {
		'fastqc': {
			dir: '/data/outbreak_investigation',
			checkFile: (f) => f.endsWith('.fastq.gz') && (f.includes('sample_01') || f.includes('sample_02') || f.includes('sample_03'))
		},
		'seqkit': {
			dir: '/data/outbreak_investigation',
			checkFile: (f) => f.endsWith('.fastq.gz')
		},
		'trimmomatic': {
			dir: '/data/outbreak_investigation',
			requiredFiles: ['sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz']
		},
		'unicycler': {
			dir: '/data/outbreak_investigation',
			checkFile: (f) => f.endsWith('_paired.fq.gz')
		},
		'bandage': {
			dir: '/data/outbreak_investigation/assembly',
			checkFile: (f) => f.endsWith('.gfa')
		},
		'prokka': {
			dir: '/data/outbreak_investigation',
			checkFile: (f) => f.endsWith('.fasta')
		},
		'abricate': {
			dir: '/data/outbreak_investigation',
			checkFile: (f) => f.endsWith('.fasta')
		}
	};

	async function executeCommand(cmd: string) {
		const parts = cmd.trim().split(/\s+/);
		const command = parts[0];
		const args = parts.slice(1);

		// Check for blocked commands (including less/more)
		if (blockedCommands.has(command) || command === 'less' || command === 'more') {
			if (command === 'less' || command === 'more') {
				terminal.writeln(`\x1b[31mbash: ${command}: command not available\x1b[0m`);
				terminal.writeln(`\x1b[90mUse 'head' or 'cat' to view files instead.\x1b[0m`);
			} else {
				terminal.writeln(`\x1b[31mbash: ${command}: Operation not permitted\x1b[0m`);
				terminal.writeln(`\x1b[90mThis is a learning environment. Modifying files is disabled.\x1b[0m`);
			}
			writePrompt();
			return;
		}

		// Handle built-in commands
		if (command === 'help') {
			showHelp();
			writePrompt();
			return;
		}

		if (command === 'clear') {
			terminal.clear();
			writePrompt();
			return;
		}

		if (command === 'pwd') {
			terminal.writeln(currentDir);
			writePrompt();
			return;
		}

		if (command === 'ls') {
			handleLs(args);
			writePrompt();
			return;
		}

		if (command === 'cd') {
			handleCd(args);
			writePrompt();
			return;
		}

		if (command === 'cat' || command === 'head' || command === 'tail') {
			handleFileView(command, args);
			writePrompt();
			return;
		}

		// Handle bioinformatics tools - require proper arguments and correct directory/files
		if (bioTools.has(command)) {
			const req = toolRequirements[command];

			// Check directory requirement
			if (req && currentDir !== req.dir) {
				const shortDir = req.dir.replace('/data/outbreak_investigation', '~');
				terminal.writeln(`\x1b[31mError: ${command} must be run from ${shortDir}\x1b[0m`);
				terminal.writeln(`\x1b[90mCurrent directory: ${currentDir.replace('/data/outbreak_investigation', '~')}\x1b[0m`);
				terminal.writeln(`\x1b[90mUse 'cd ${shortDir}' to navigate there first.\x1b[0m`);
				writePrompt();
				return;
			}

			// Check command has proper arguments
			if (command === 'fastqc') {
				if (args.length === 0) {
					terminal.writeln(`\x1b[31mUsage: fastqc <input.fastq.gz> -o <output_dir>\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: fastqc sample_01_R1.fastq.gz -o qc_reports/\x1b[0m`);
					writePrompt();
					return;
				}
				// Check file is valid
				const inputFile = args.find(a => a.endsWith('.fastq.gz'));
				if (!inputFile || !req?.checkFile?.(inputFile)) {
					terminal.writeln(`\x1b[31mError: Invalid input file '${inputFile || args[0]}'\x1b[0m`);
					terminal.writeln(`\x1b[90mFastQC requires a valid .fastq.gz file (e.g., sample_01_R1.fastq.gz)\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'trimmomatic') {
				if (args.length < 5) {
					terminal.writeln(`\x1b[31mUsage: trimmomatic PE -phred33 <R1.fq.gz> <R2.fq.gz> <output_files...> <options>\x1b[0m`);
					terminal.writeln(`\x1b[90mThis tool requires paired-end input files and trimming parameters.\x1b[0m`);
					writePrompt();
					return;
				}
				// Check PE mode and paired files
				if (!args.includes('PE')) {
					terminal.writeln(`\x1b[31mError: Trimmomatic requires 'PE' mode for paired-end reads\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'unicycler') {
				if (!args.includes('-1') || !args.includes('-2')) {
					terminal.writeln(`\x1b[31mUsage: unicycler -1 <R1_paired.fq.gz> -2 <R2_paired.fq.gz> -o <output_dir>\x1b[0m`);
					terminal.writeln(`\x1b[90mThis tool requires paired-end trimmed reads.\x1b[0m`);
					writePrompt();
					return;
				}
				// Check that input files are trimmed paired files
				const r1Idx = args.indexOf('-1');
				const r2Idx = args.indexOf('-2');
				const r1File = args[r1Idx + 1];
				const r2File = args[r2Idx + 1];
				if (!r1File?.includes('_paired') || !r2File?.includes('_paired')) {
					terminal.writeln(`\x1b[31mError: Unicycler requires trimmed paired files\x1b[0m`);
					terminal.writeln(`\x1b[90mUse files from trimmed/ folder (e.g., sample_01_R1_paired.fq.gz)\x1b[0m`);
					writePrompt();
					return;
				}
			}

			if (command === 'bandage') {
				if (args.length < 2 || !args.includes('image')) {
					terminal.writeln(`\x1b[31mUsage: bandage image <assembly.gfa> <output.png>\x1b[0m`);
					terminal.writeln(`\x1b[90mExample: bandage image assembly.gfa assembly_graph.png\x1b[0m`);
					writePrompt();
					return;
				}
				// Check GFA file
				const gfaFile = args.find(a => a.endsWith('.gfa'));
				if (!gfaFile) {
					terminal.writeln(`\x1b[31mError: Bandage requires a .gfa assembly graph file\x1b[0m`);
					writePrompt();
					return;
				}
			}

			await executeBioTool(command, args, cmd);
			return;
		}

		// Unknown command
		terminal.writeln(`\x1b[31mbash: ${command}: command not found\x1b[0m`);
		terminal.writeln(`\x1b[90mType 'help' for available commands\x1b[0m`);
		writePrompt();
	}

	function showHelp() {
		terminal.writeln('');
		terminal.writeln('\x1b[1;33m════════════════════════════════════════════════════════\x1b[0m');
		terminal.writeln('\x1b[1;33m  BioLearn Terminal - Available Commands\x1b[0m');
		terminal.writeln('\x1b[1;33m════════════════════════════════════════════════════════\x1b[0m');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mFile Navigation:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  ls [path]       List directory contents');
		terminal.writeln('  cd [path]       Change directory');
		terminal.writeln('  pwd             Print working directory');
		terminal.writeln('  cat [file]      View file contents');
		terminal.writeln('  head [file]     View first 10 lines');
		terminal.writeln('  tail [file]     View last 10 lines');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mBioinformatics Tools:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  \x1b[32mseqkit stats\x1b[0m    Read statistics (~3s)');
		terminal.writeln('  \x1b[32mfastqc\x1b[0m          Quality control (~10s)');
		terminal.writeln('  \x1b[32mtrimmomatic\x1b[0m     Read trimming (~45s)');
		terminal.writeln('  \x1b[32municycler\x1b[0m       Genome assembly (~3-5min)');
		terminal.writeln('  \x1b[32mbandage\x1b[0m         Visualize assembly graph (~5s)');
		terminal.writeln('  \x1b[32mquast\x1b[0m           Assembly QC (~20s)');
		terminal.writeln('  \x1b[32mprokka\x1b[0m          Genome annotation (~1-2min)');
		terminal.writeln('  \x1b[32mabricate\x1b[0m        AMR screening (~10s)');
		terminal.writeln('  \x1b[32mmlst\x1b[0m            Sequence typing (~5s)');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mKeyboard Shortcuts:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  ↑/↓             Browse command history');
		terminal.writeln('  ←/→             Move cursor in command line');
		terminal.writeln('  Tab             Autocomplete file names');
		terminal.writeln('  Ctrl+L          Clear screen');
		terminal.writeln('  Ctrl+C          Cancel running command');
		terminal.writeln('');
		terminal.writeln('\x1b[1;36mUtility:\x1b[0m');
		terminal.writeln('');
		terminal.writeln('  help            Show this message');
		terminal.writeln('  clear           Clear terminal');
		terminal.writeln('');
	}

	function handleLs(args: string[]) {
		const filesystem = getFilesystem();
		const path = args[0] || currentDir;
		const fullPath = path.startsWith('/') ? path : `${currentDir}/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
		const files = filesystem[fullPath] || [];

		if (files.length === 0) {
			terminal.writeln('\x1b[90m(empty directory)\x1b[0m');
			return;
		}

		const formatted = files.map(f => {
			if (f.endsWith('/')) {
				return `\x1b[34m${f}\x1b[0m`;
			} else if (f.endsWith('.gz') || f.endsWith('.fastq') || f.endsWith('.fasta')) {
				return `\x1b[32m${f}\x1b[0m`;
			} else if (f.endsWith('.html') || f.endsWith('.log')) {
				return `\x1b[33m${f}\x1b[0m`;
			} else if (f.endsWith('.png') || f.endsWith('.svg')) {
				return `\x1b[35m${f}\x1b[0m`;
			}
			return f;
		});

		// Display in columns
		terminal.writeln(formatted.join('  '));
	}

	function handleCd(args: string[]) {
		const filesystem = getFilesystem();

		if (args.length === 0 || args[0] === '~') {
			currentDir = '/data/outbreak_investigation';
			currentDirectory.set(currentDir);
			return;
		}

		let targetPath = args[0];

		// Handle .. (parent directory)
		if (targetPath === '..' || targetPath === '../' || targetPath.startsWith('../')) {
			const parts = currentDir.split('/').filter(p => p);
			if (parts.length > 0) {
				parts.pop();
			}
			if (targetPath.startsWith('../')) {
				// Handle ../something
				const remaining = targetPath.slice(3);
				if (remaining) {
					currentDir = '/' + parts.join('/');
					currentDirectory.set(currentDir);
					handleCd([remaining]);
					return;
				}
			}
			currentDir = parts.length > 0 ? '/' + parts.join('/') : '/data';
			// Don't go above /data
			if (!currentDir.startsWith('/data')) {
				currentDir = '/data/outbreak_investigation';
			}
			currentDirectory.set(currentDir);
			return;
		}

		// Build full path
		const newPath = targetPath.startsWith('/')
			? targetPath
			: `${currentDir}/${targetPath}`.replace(/\/+/g, '/').replace(/\/$/, '');

		// Check if directory exists in filesystem
		if (filesystem[newPath] !== undefined) {
			currentDir = newPath;
			currentDirectory.set(currentDir);
		} else {
			terminal.writeln(`\x1b[31mbash: cd: ${args[0]}: No such directory\x1b[0m`);
		}
	}

	// File contents for different file types
	const fileContents: Record<string, string> = {
		// FASTQ files
		'.fastq.gz': `\x1b[90m[Compressed file - showing first reads]\x1b[0m
@M00123:45:000000000-ABC12:1:1101:15234:1000 1:N:0:1
ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
@M00123:45:000000000-ABC12:1:1101:15235:1001 1:N:0:1
GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
@M00123:45:000000000-ABC12:1:1101:15236:1002 1:N:0:1
TACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTACGTAC
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
...`,
		'.fq.gz': `\x1b[90m[Compressed file - showing first reads]\x1b[0m
@M00123:45:000000000-ABC12:1:1101:15234:1000 1:N:0:1
ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG
+
FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
...`,
		// FASTA assembly
		'assembly.fasta': `>chromosome_1 length=4892156 circular=true
ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGTAACGGTGCGGGCTGA
CGCGTACAGGAAACACAGAAAAAAGCCCGCACCTGACAGTGCGGGCTTTTTTTTTCGACCAAAGGT
AACGAGGTAACAACCATGCGAGTGTTGAAGTTCGGCGGTACATCAGTGGCAAATGCAGAACGTTTT
CTGCGTGTTGCCGATATTCTGGAAAGCAATGCCAGGCAGGGGCAGGTGGCCACCGTCCTCTCTGCC
CCCGCCAAAATCACCAACCACCTGGTGGCGATGATTGAAAAAACCATTAGCGGCCAGGATGCTTTAC
CCAATATCAGCGATGCCGAACGTATTTTTGCCGAACTTTTGACGGGACTCGCCGCCGCCCAGCCGG
GGTTCCCGCTGGCGCAATTGAAAACTTTCGTCGATCAGGAATTTGCCCAAATAAAACATGTCCTGC
ATGGCATTAGTTTGTTGGGGCAGTGCCCGGATAGCATCAACGCTGCGCTGATTTGCCGTGGCGAGA
AAATGTCGATCGCCATTATGGCCGGCGTATTAGAAGCGCGCGGTCACAACGTTACTGTTATCGATC
CGGTTGATTTCAGAGCTGCCCATGTTTGCGATGGCGGCATGTTTGTTGATGAAACGCGCGAATCGA
...`,
		// GFA assembly graph
		'assembly.gfa': `H	VN:Z:1.0
S	1	ATGAAACGCATTAGCACCACCATTACCACCACCATCACCATTACCACAGGT
S	2	AACGGTGCGGGCTGACGCGTACAGGAAACACAGAAAAAAGCCCGCACCTGA
S	3	CAGTGCGGGCTTTTTTTTTCGACCAAAGGTAACGAGGTAACAACCATGCGA
S	4	GTGTTGAAGTTCGGCGGTACATCAGTGGCAAATGCAGAACGTTTTCTGCGT
L	1	+	2	+	45M
L	2	+	3	+	45M
L	3	+	4	+	45M
L	4	+	1	+	45M
P	chromosome	1+,2+,3+,4+	45M,45M,45M
...`,
		// Unicycler log
		'unicycler.log': `
Unicycler v0.5.0
Command: unicycler -1 sample_01_R1_paired.fq.gz -2 sample_01_R2_paired.fq.gz -o assembly/

2024-01-15 10:23:45 - Starting Unicycler
2024-01-15 10:23:45 - Checking dependencies
2024-01-15 10:23:46 - SPAdes version: 3.15.5
2024-01-15 10:23:46 - Racon version: 1.5.0
2024-01-15 10:23:47 - Loading reads
2024-01-15 10:23:52 - Read count: 2,394,012 pairs
2024-01-15 10:24:15 - Running SPAdes assembly
2024-01-15 10:35:23 - SPAdes assembly complete
...`,
		// FastQC HTML (simplified)
		'_fastqc.html': `<!DOCTYPE html>
<html>
<head><title>FastQC Report</title></head>
<body>
<h1>FastQC Report - sample_01_R1</h1>
<h2>Basic Statistics</h2>
<table>
  <tr><td>Filename</td><td>sample_01_R1.fastq.gz</td></tr>
  <tr><td>Total Sequences</td><td>2,456,789</td></tr>
  <tr><td>Sequence length</td><td>150</td></tr>
  <tr><td>%GC</td><td>52</td></tr>
</table>
...`,
		// TSV report
		'.tsv': `#Sample	Total_Reads	Mapped_Reads	Coverage	GC_Content
sample_01	2456789	2394012	97.44	52.3
sample_02	2489123	2421456	97.28	51.9
sample_03	2512456	2445678	97.34	52.1
...`,
		// GFF annotation
		'.gff': `##gff-version 3
##sequence-region chromosome_1 1 4892156
chromosome_1	Prokka	gene	1	1350	.	+	.	ID=gene_0001;Name=dnaA
chromosome_1	Prokka	CDS	1	1350	.	+	0	ID=CDS_0001;Parent=gene_0001;product=Chromosomal replication initiator protein DnaA
chromosome_1	Prokka	gene	1524	2624	.	+	.	ID=gene_0002;Name=dnaN
chromosome_1	Prokka	CDS	1524	2624	.	+	0	ID=CDS_0002;Parent=gene_0002;product=Beta sliding clamp
chromosome_1	Prokka	gene	2801	3901	.	+	.	ID=gene_0003;Name=recF
chromosome_1	Prokka	CDS	2801	3901	.	+	0	ID=CDS_0003;Parent=gene_0003;product=DNA replication and repair protein RecF
chromosome_1	Prokka	gene	3978	6311	.	+	.	ID=gene_0004;Name=gyrB
chromosome_1	Prokka	CDS	3978	6311	.	+	0	ID=CDS_0004;Parent=gene_0004;product=DNA gyrase subunit B
...`,
		// GenBank format
		'.gbk': `LOCUS       chromosome_1         4892156 bp    DNA     circular BCT 15-JAN-2024
DEFINITION  Klebsiella pneumoniae strain sample_01 chromosome, complete genome.
ACCESSION   CP000001
VERSION     CP000001.1
KEYWORDS    .
SOURCE      Klebsiella pneumoniae
  ORGANISM  Klebsiella pneumoniae
            Bacteria; Proteobacteria; Gammaproteobacteria; Enterobacterales;
            Enterobacteriaceae; Klebsiella.
FEATURES             Location/Qualifiers
     source          1..4892156
                     /organism="Klebsiella pneumoniae"
                     /mol_type="genomic DNA"
                     /strain="sample_01"
...`,
		// AMR report
		'amr_report.tsv': `#FILE	SEQUENCE	START	END	STRAND	GENE	COVERAGE	IDENTITY	DATABASE	ACCESSION	PRODUCT	RESISTANCE
sample_01	chromosome	123456	124789	+	blaSHV-11	100.00	99.89	CARD	ARO:3000839	SHV-11 beta-lactamase	ampicillin;amoxicillin
sample_01	chromosome	234567	235890	+	oqxA	100.00	98.76	CARD	ARO:3002999	multidrug efflux pump	quinolone
sample_01	plasmid_1	12345	14567	+	blaCTX-M-15	100.00	100.00	CARD	ARO:3000096	CTX-M-15 extended-spectrum beta-lactamase	cefotaxime;ceftazidime
...`,
		// Default text file
		'.txt': `Analysis Summary
================
Sample: sample_01
Date: 2024-01-15
Status: Complete

Quality metrics passed all thresholds.
Assembly completed successfully.
Annotation identified 4,523 coding sequences.
...`
	};

	function handleFileView(cmd: string, args: string[]) {
		if (args.length === 0) {
			terminal.writeln(`\x1b[31m${cmd}: missing file operand\x1b[0m`);
			return;
		}

		const filename = args[0];
		const filesystem = getFilesystem();

		// Resolve the path
		let fullPath: string;
		let dirPath: string;
		let baseName: string;

		if (filename.includes('/')) {
			// Path includes directory
			const parts = filename.split('/');
			baseName = parts.pop() || '';
			const relativeDirPath = parts.join('/');
			dirPath = relativeDirPath.startsWith('/')
				? relativeDirPath
				: `${currentDir}/${relativeDirPath}`.replace(/\/+/g, '/');
			fullPath = `${dirPath}/${baseName}`;
		} else {
			baseName = filename;
			dirPath = currentDir;
			fullPath = `${currentDir}/${filename}`;
		}

		// Check if file exists in filesystem
		const filesInDir = filesystem[dirPath] || [];
		const fileExists = filesInDir.some(f => f === baseName || f === baseName + '/');

		if (!fileExists) {
			terminal.writeln(`\x1b[31m${cmd}: ${filename}: No such file or directory\x1b[0m`);
			return;
		}

		// Check if it's a directory
		if (filesInDir.includes(baseName + '/')) {
			terminal.writeln(`\x1b[31m${cmd}: ${filename}: Is a directory\x1b[0m`);
			return;
		}

		// Get file content based on extension or name
		let content: string | null = null;

		// Check for exact filename matches first
		for (const [key, value] of Object.entries(fileContents)) {
			if (baseName === key || baseName.endsWith(key)) {
				content = value;
				break;
			}
		}

		// If no match, try extension
		if (!content) {
			const ext = '.' + baseName.split('.').pop();
			content = fileContents[ext] || null;
		}

		// Special handling for specific file types
		if (!content) {
			if (baseName.endsWith('.fastq.gz') || baseName.endsWith('.fq.gz')) {
				content = fileContents['.fastq.gz'];
			} else if (baseName.endsWith('.fasta') || baseName.endsWith('.fna') || baseName.endsWith('.faa') || baseName.endsWith('.ffn')) {
				content = fileContents['assembly.fasta'];
			} else if (baseName.endsWith('.gfa')) {
				content = fileContents['assembly.gfa'];
			} else if (baseName.endsWith('.log')) {
				content = fileContents['unicycler.log'];
			} else if (baseName.endsWith('.html')) {
				content = fileContents['_fastqc.html'];
			} else if (baseName.endsWith('.tsv')) {
				content = fileContents['.tsv'];
			} else if (baseName.endsWith('.gff')) {
				content = fileContents['.gff'];
			} else if (baseName.endsWith('.gbk')) {
				content = fileContents['.gbk'];
			} else if (baseName.endsWith('.png') || baseName.endsWith('.svg')) {
				terminal.writeln(`\x1b[90m[Binary image file - cannot display in terminal]\x1b[0m`);
				terminal.writeln(`\x1b[90mFile: ${baseName}\x1b[0m`);
				return;
			} else if (baseName.endsWith('.zip')) {
				terminal.writeln(`\x1b[90m[Compressed archive - cannot display in terminal]\x1b[0m`);
				terminal.writeln(`\x1b[90mFile: ${baseName}\x1b[0m`);
				return;
			} else {
				content = fileContents['.txt'];
			}
		}

		// Display the content
		if (content) {
			const lines = content.split('\n');
			const maxLines = cmd === 'head' ? 10 : (cmd === 'tail' ? 10 : lines.length);
			const startLine = cmd === 'tail' ? Math.max(0, lines.length - maxLines) : 0;

			for (let i = startLine; i < Math.min(startLine + maxLines, lines.length); i++) {
				terminal.writeln(lines[i]);
			}
		}
	}

	async function executeBioTool(tool: string, args: string[], fullCmd: string) {
		isExecuting = true;
		const times = toolExecutionTimes[tool] || { min: 5, max: 15 };
		const execTime = Math.floor(Math.random() * (times.max - times.min + 1)) + times.min;

		// Update terminal state for output panel
		terminalState.set({
			isRunning: true,
			currentCommand: fullCmd,
			progress: 0,
			estimatedTime: execTime
		});

		// Show tool startup with disclaimer
		terminal.writeln(`\x1b[36m[${tool}]\x1b[0m Starting analysis...`);
		terminal.writeln(`\x1b[90mEstimated time: ~${execTime}s\x1b[0m`);
		terminal.writeln(`\x1b[90;3m(Note: This is a simulated duration. Real analysis may take minutes to hours.)\x1b[0m`);
		terminal.writeln('');

		// Get dynamic tool output
		const toolData = getToolOutput(tool, args, fullCmd);
		const outputLines = toolData?.output?.split('\n') || [];
		const interval = (execTime * 1000) / Math.max(outputLines.length, 10);

		for (let i = 0; i < outputLines.length; i++) {
			await sleep(interval);
			if (!isExecuting) break;

			terminal.writeln(outputLines[i]);
			const progress = Math.floor(((i + 1) / outputLines.length) * 100);
			terminalState.update(s => ({ ...s, progress }));
		}

		if (isExecuting && toolData) {
			// Track executed command for dynamic filesystem
			executedCommands.update(cmds => {
				if (!cmds.includes(tool)) {
					return [...cmds, tool];
				}
				return cmds;
			});

			// Update output panel with results
			outputData.set({
				type: tool,
				title: `${tool.charAt(0).toUpperCase() + tool.slice(1)} Results`,
				tool: fullCmd,
				summary: toolData.summary,
				chartData: toolData.chartData,
				files: toolData.files
			});

			terminal.writeln('');
			terminal.writeln(`\x1b[32m✓ Analysis complete\x1b[0m`);
		}

		isExecuting = false;
		terminalState.set({ isRunning: false, currentCommand: '', progress: 100, estimatedTime: 0 });
		writePrompt();
	}

	function sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	onMount(async () => {
		const { Terminal } = await import('@xterm/xterm');
		const { FitAddon } = await import('@xterm/addon-fit');
		const { WebLinksAddon } = await import('@xterm/addon-web-links');
		await import('@xterm/xterm/css/xterm.css');

		terminal = new Terminal(terminalOptions);
		fitAddon = new FitAddon();
		const webLinksAddon = new WebLinksAddon();

		terminal.loadAddon(fitAddon);
		terminal.loadAddon(webLinksAddon);
		terminal.open(terminalContainer);

		setTimeout(() => fitAddon.fit(), 0);

		resizeObserver = new ResizeObserver(() => {
			fitAddon.fit();
		});
		resizeObserver.observe(terminalContainer);

		// Welcome message
		terminal.writeln('\x1b[1;36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   \x1b[1;32mBioLearn\x1b[0m - Bioinformatics Learning Terminal             \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   Type \x1b[33mhelp\x1b[0m for available commands                         \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m║\x1b[0m   Use ↑/↓ for history, Tab for autocomplete               \x1b[1;36m║\x1b[0m');
		terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
		writePrompt();

		terminal.onData(handleInput);
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
		if (terminal) terminal.dispose();
	});
</script>

<div class="flex flex-col h-full bg-gray-900">
	<!-- Command dropdown bar -->
	<div class="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700 text-xs">
		<span class="text-gray-400">Commands:</span>
		<div class="flex gap-1 flex-wrap">
			{#each ['ls', 'cd', 'pwd', 'cat', 'head', 'tail', 'clear', 'help'] as cmd}
				<span class="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px]">{cmd}</span>
			{/each}
			<span class="text-gray-500 mx-1">|</span>
			{#each ['fastqc', 'trimmomatic', 'unicycler', 'bandage', 'prokka', 'abricate'] as cmd}
				<span class="px-1.5 py-0.5 bg-green-900/50 text-green-400 rounded text-[10px]">{cmd}</span>
			{/each}
		</div>
	</div>
	<!-- Terminal -->
	<div bind:this={terminalContainer} class="flex-1 p-2 bg-[#1e1e1e]"></div>
</div>

<style>
	:global(.xterm) {
		padding: 8px;
	}

	:global(.xterm-viewport) {
		overflow-y: auto !important;
	}
</style>
