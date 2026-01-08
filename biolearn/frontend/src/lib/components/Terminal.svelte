<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { outputData, terminalState, toolExecutionTimes, allowedCommands, blockedCommands, bioTools, executedCommands, executedSteps, currentDirectory } from '$lib/stores/terminal';
	import { get } from 'svelte/store';

	let terminalContainer: HTMLDivElement;
	let terminal: any;
	let fitAddon: any;
	let resizeObserver: ResizeObserver;
	let commandBuffer = '';
	let isExecuting = false;
	let currentDir = '/data/outbreak_investigation';

	// Track which tools have been run for dynamic filesystem
	let executedToolsList: string[] = [];
	executedCommands.subscribe(cmds => executedToolsList = cmds);

	// Base filesystem - only raw input files exist at start
	const baseFilesystem: Record<string, string[]> = {
		'/data/outbreak_investigation': [
			'raw_reads/',
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz',
			'sample_02_R1.fastq.gz', 'sample_02_R2.fastq.gz',
			'sample_03_R1.fastq.gz', 'sample_03_R2.fastq.gz'
		],
		'/data/outbreak_investigation/raw_reads': [
			'sample_01_R1.fastq.gz', 'sample_01_R2.fastq.gz',
			'sample_02_R1.fastq.gz', 'sample_02_R2.fastq.gz'
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

	// Pre-computed tool outputs with realistic terminal output
	const toolOutputs: Record<string, any> = {
		'seqkit': {
			output: `\x1b[32m[INFO]\x1b[0m Processing sample_01_R1.fastq.gz...
file                      format  type   num_seqs      sum_len  min_len  avg_len  max_len
sample_01_R1.fastq.gz     FASTQ   DNA    2,456,789  368,518,350      150      150      150

\x1b[32m[INFO]\x1b[0m Summary Statistics:
  Total reads:     2,456,789
  Total bases:     368,518,350
  GC content:      52.3%
  Q20 bases:       97.2%
  Q30 bases:       93.8%
`,
			summary: {
				'Total Reads': '2,456,789',
				'Total Bases': '368.5 Mb',
				'Read Length': '150 bp',
				'GC Content': '52.3%',
				'Q20 Bases': '97.2%',
				'Q30 Bases': '93.8%'
			},
			files: [{ name: 'seqkit_stats.txt', type: 'txt', size: '1.2 KB' }]
		},
		'fastqc': {
			output: `Started analysis of sample_01_R1.fastq.gz
Approx 5% complete for sample_01_R1.fastq.gz
Approx 15% complete for sample_01_R1.fastq.gz
Approx 30% complete for sample_01_R1.fastq.gz
Approx 50% complete for sample_01_R1.fastq.gz
Approx 70% complete for sample_01_R1.fastq.gz
Approx 85% complete for sample_01_R1.fastq.gz
Approx 95% complete for sample_01_R1.fastq.gz
Analysis complete for sample_01_R1.fastq.gz
`,
			summary: {
				'Total Sequences': '2,456,789',
				'Sequence Length': '150 bp',
				'GC Content': '52%',
				'Per Base Quality': 'PASS',
				'Adapter Content': 'WARNING (3.2%)',
				'Overall Quality': 'PASS'
			},
			chartData: {
				title: 'Per Base Sequence Quality',
				positions: Array.from({ length: 150 }, (_, i) => i + 1),
				scores: Array.from({ length: 150 }, (_, i) => 32 + Math.random() * 6 - (i > 130 ? (i - 130) * 0.3 : 0)),
				xLabel: 'Position in read (bp)',
				yLabel: 'Quality Score (Phred)'
			},
			files: [
				{ name: 'sample_01_R1_fastqc.html', type: 'html', size: '245 KB' },
				{ name: 'sample_01_R1_fastqc.zip', type: 'zip', size: '1.2 MB' }
			]
		},
		'trimmomatic': {
			output: `TrimmomaticPE: Started with arguments:
 -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz ...
Using PrefixPair: 'TACACTCTTTCCCTACACGACGCTCTTCCGATCT' and 'GTGACTGGAGTTCAGACGTGTGCTCTTCCGATCT'
ILLUMINACLIP: Using 1 prefix pairs, 2 forward/reverse sequences
Quality encoding detected as phred33
Input Read Pairs: 2456789
  Both Surviving: 2398456 (97.63%)
  Forward Only Surviving: 32145 (1.31%)
  Reverse Only Surviving: 18234 (0.74%)
  Dropped: 7954 (0.32%)
TrimmomaticPE: Completed successfully
`,
			summary: {
				'Input Reads': '2,456,789 pairs',
				'Both Surviving': '2,398,456 (97.63%)',
				'Forward Only': '32,145 (1.31%)',
				'Reverse Only': '18,234 (0.74%)',
				'Dropped': '7,954 (0.32%)'
			},
			files: [
				{ name: 'sample_01_R1_paired.fq.gz', type: 'fastq', size: '342 MB' },
				{ name: 'sample_01_R2_paired.fq.gz', type: 'fastq', size: '341 MB' }
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
  Forward reads: 2,398,456
  Reverse reads: 2,398,456

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
		}
	};

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

	function handleInput(data: string) {
		if (isExecuting) return;

		if (data === '\r') {
			terminal.write('\r\n');
			if (commandBuffer.trim()) {
				executeCommand(commandBuffer.trim());
			} else {
				writePrompt();
			}
			commandBuffer = '';
		} else if (data === '\x7f') {
			if (commandBuffer.length > 0) {
				commandBuffer = commandBuffer.slice(0, -1);
				terminal.write('\b \b');
			}
		} else if (data === '\x03') {
			terminal.write('^C');
			commandBuffer = '';
			isExecuting = false;
			terminalState.set({ isRunning: false, currentCommand: '', progress: 0, estimatedTime: 0 });
			writePrompt();
		} else if (data === '\t') {
			// Tab autocomplete
			handleTabComplete();
		} else if (data >= ' ') {
			commandBuffer += data;
			terminal.write(data);
		}
	}

	function handleTabComplete() {
		const parts = commandBuffer.split(/\s+/);
		const lastPart = parts[parts.length - 1] || '';

		// Get current filesystem
		const filesystem = getFilesystem();
		const files = filesystem[currentDir] || [];

		// Find matches
		const matches = files.filter(f => f.startsWith(lastPart));

		if (matches.length === 0) {
			return; // No matches
		} else if (matches.length === 1) {
			// Single match - complete it
			const completion = matches[0].slice(lastPart.length);
			commandBuffer += completion;
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

			// Find common prefix
			const commonPrefix = findCommonPrefix(matches);
			if (commonPrefix.length > lastPart.length) {
				const completion = commonPrefix.slice(lastPart.length);
				commandBuffer += completion;
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

	async function executeCommand(cmd: string) {
		const parts = cmd.trim().split(/\s+/);
		const command = parts[0];
		const args = parts.slice(1);

		// Check for blocked commands
		if (blockedCommands.has(command)) {
			terminal.writeln(`\x1b[31mbash: ${command}: Operation not permitted\x1b[0m`);
			terminal.writeln(`\x1b[90mThis is a learning environment. Modifying files is disabled.\x1b[0m`);
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

		// Handle bioinformatics tools
		if (bioTools.has(command)) {
			await executeBioTool(command, args, cmd);
			return;
		}

		// Unknown command
		terminal.writeln(`\x1b[31mbash: ${command}: command not found\x1b[0m`);
		terminal.writeln(`\x1b[90mType 'help' for available commands\x1b[0m`);
		writePrompt();
	}

	function showHelp() {
		terminal.writeln(`
\x1b[1;33m═══════════════════════════════════════════════════════════════\x1b[0m
\x1b[1;33m  BioLearn Terminal - Available Commands\x1b[0m
\x1b[1;33m═══════════════════════════════════════════════════════════════\x1b[0m

\x1b[1;36mFile Navigation:\x1b[0m
  ls [path]      - List directory contents
  cd [path]      - Change directory
  pwd            - Print working directory
  cat [file]     - View file contents
  head [file]    - View first 10 lines
  tail [file]    - View last 10 lines

\x1b[1;36mBioinformatics Tools:\x1b[0m
  \x1b[32mseqkit stats\x1b[0m   - Read statistics (~3s)
  \x1b[32mfastqc\x1b[0m         - Quality control (~10s)
  \x1b[32mtrimmomatic\x1b[0m    - Read trimming (~45s)
  \x1b[32municycler\x1b[0m      - Genome assembly (~3-5min)
  \x1b[32mquast\x1b[0m          - Assembly QC (~20s)
  \x1b[32mprokka\x1b[0m         - Genome annotation (~1-2min)
  \x1b[32mabricate\x1b[0m       - AMR screening (~10s)
  \x1b[32mmlst\x1b[0m           - Sequence typing (~5s)

\x1b[1;36mUtility:\x1b[0m
  help           - Show this message
  clear          - Clear terminal
  Ctrl+C         - Cancel running command
`);
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

	function handleFileView(cmd: string, args: string[]) {
		if (args.length === 0) {
			terminal.writeln(`\x1b[31m${cmd}: missing file operand\x1b[0m`);
			return;
		}

		const filename = args[0];
		if (filename.endsWith('.fastq.gz') || filename.endsWith('.fq.gz')) {
			terminal.writeln(`\x1b[90m[Binary file - showing first reads]\x1b[0m`);
			terminal.writeln(`@M00123:45:000000000-ABC12:1:1101:15234:1000 1:N:0:1`);
			terminal.writeln(`ATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG...`);
			terminal.writeln(`+`);
			terminal.writeln(`FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF...`);
		} else {
			terminal.writeln(`\x1b[31m${cmd}: ${filename}: No such file\x1b[0m`);
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

		// Simulate progress
		const toolData = toolOutputs[tool];
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
		terminal.writeln('\x1b[1;36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
		writePrompt();

		terminal.onData(handleInput);
	});

	onDestroy(() => {
		if (resizeObserver) resizeObserver.disconnect();
		if (terminal) terminal.dispose();
	});
</script>

<div bind:this={terminalContainer} class="w-full h-full p-2"></div>

<style>
	div {
		background-color: #1e1e1e;
	}

	:global(.xterm) {
		padding: 8px;
	}

	:global(.xterm-viewport) {
		overflow-y: auto !important;
	}
</style>
