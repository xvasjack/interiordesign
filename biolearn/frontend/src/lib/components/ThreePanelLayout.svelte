<script lang="ts">
	import { onMount } from 'svelte';
	import Terminal from './Terminal.svelte';
	import StoryPanel from './StoryPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';
	import { executedCommands } from '$lib/stores/terminal';

	let {
		storyContent = '',
		currentStep = 0,
		outputData = null
	}: {
		storyContent?: string;
		currentStep?: number;
		outputData?: any;
	} = $props();

	let terminalHeight = $state(70); // percentage
	let isResizing = $state(false);
	let filesDropdownOpen = $state(false);
	let allGeneratedFiles = $state<{name: string, type: string, tool: string}[]>([]);

	// File contents for viewing
	const fileContents: Record<string, string> = {
		'seqkit_stats.txt': `file\tformat\ttype\tnum_seqs\tsum_len\tmin_len\tavg_len\tmax_len\nsample_01_R1.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150\nsample_01_R2.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150`,
		'sample_01_R1_fastqc.html': `<!DOCTYPE html><html><head><title>FastQC Report - sample_01_R1</title><style>body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;} .summary{background:#f5f5f5;padding:15px;border-radius:5px;} .pass{color:green;} .warn{color:orange;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:8px;}</style></head><body><h1>FastQC Report</h1><div class="summary"><h2>Summary</h2><p><span class="pass">✓</span> Basic Statistics</p><p><span class="pass">✓</span> Per base sequence quality</p><p><span class="pass">✓</span> Per sequence quality scores</p></div><h2>Basic Statistics</h2><table><tr><th>Measure</th><th>Value</th></tr><tr><td>Filename</td><td>sample_01_R1.fastq.gz</td></tr><tr><td>Total Sequences</td><td>2,847,293</td></tr><tr><td>Sequence Length</td><td>150</td></tr><tr><td>%GC</td><td>52</td></tr></table></body></html>`,
		'sample_01_R2_fastqc.html': `<!DOCTYPE html><html><head><title>FastQC Report - sample_01_R2</title><style>body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;} .summary{background:#f5f5f5;padding:15px;border-radius:5px;} .pass{color:green;} .warn{color:orange;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:8px;}</style></head><body><h1>FastQC Report</h1><div class="summary"><h2>Summary</h2><p><span class="pass">✓</span> Basic Statistics</p><p><span class="pass">✓</span> Per base sequence quality</p><p><span class="pass">✓</span> Per sequence quality scores</p></div><h2>Basic Statistics</h2><table><tr><th>Measure</th><th>Value</th></tr><tr><td>Filename</td><td>sample_01_R2.fastq.gz</td></tr><tr><td>Total Sequences</td><td>2,847,293</td></tr><tr><td>Sequence Length</td><td>150</td></tr><tr><td>%GC</td><td>52</td></tr></table></body></html>`,
		'assembly.fasta': `>contig_1 length=4892156 depth=45.2x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n>contig_2 length=95234 depth=78.5x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT`,
		'assembly.gfa': `H\tVN:Z:1.0\nS\t1\tATGCGTACGTAGCTAGCTAGCTAGCTAGCT\tLN:i:4892156\nS\t2\tGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\tLN:i:95234`,
		'unicycler.log': `[2024-01-15 10:23:45] Starting Unicycler v0.5.0\n[2024-01-15 10:25:12] Assembly completed successfully\n[2024-01-15 10:25:12] 2 contigs assembled\n[2024-01-15 10:25:12] Total length: 4,987,390 bp`,
		'quast_report.html': `<!DOCTYPE html><html><head><title>QUAST Report</title><style>body{font-family:Arial;margin:20px;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:12px;} th{background:#4CAF50;color:white;}</style></head><body><h1>QUAST Report</h1><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total contigs</td><td>2</td></tr><tr><td>Total length</td><td>4,987,390 bp</td></tr><tr><td>N50</td><td>4,892,156 bp</td></tr></table></body></html>`,
		'amr_report.tsv': `#FILE\tSEQUENCE\tGENE\t%IDENTITY\tRESISTANCE\nassembly.fasta\tcontig_1\tblaCTX-M-15\t99.89\tCephalosporin\nassembly.fasta\tcontig_2\ttet(A)\t100.00\tTetracycline`,
		'amr_summary.txt': `AMR Gene Summary\n================\nTotal genes found: 2\n\n1. blaCTX-M-15 - Cephalosporin resistance\n2. tet(A) - Tetracycline resistance`
	};

	// Tool to files mapping
	const toolFiles: Record<string, {name: string, type: string}[]> = {
		'seqkit': [{ name: 'seqkit_stats.txt', type: 'txt' }],
		'fastqc': [
			{ name: 'sample_01_R1_fastqc.html', type: 'html' },
			{ name: 'sample_01_R2_fastqc.html', type: 'html' },
			{ name: 'sample_01_R1_fastqc.zip', type: 'zip' },
			{ name: 'sample_01_R2_fastqc.zip', type: 'zip' }
		],
		'trimmomatic': [
			{ name: 'sample_01_R1_paired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R2_paired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R1_unpaired.fq.gz', type: 'fastq' },
			{ name: 'sample_01_R2_unpaired.fq.gz', type: 'fastq' }
		],
		'unicycler': [
			{ name: 'assembly.fasta', type: 'fasta' },
			{ name: 'assembly.gfa', type: 'gfa' },
			{ name: 'unicycler.log', type: 'log' }
		],
		'bandage': [{ name: 'assembly_graph.png', type: 'png' }],
		'quast': [
			{ name: 'quast_report.html', type: 'html' },
			{ name: 'quast_report.tsv', type: 'tsv' }
		],
		'abricate': [
			{ name: 'amr_report.tsv', type: 'tsv' },
			{ name: 'amr_summary.txt', type: 'txt' }
		]
	};

	onMount(() => {
		const unsubscribe = executedCommands.subscribe(cmds => {
			const files: {name: string, type: string, tool: string}[] = [];
			cmds.forEach(tool => {
				const toolFileList = toolFiles[tool];
				if (toolFileList) {
					toolFileList.forEach(f => {
						files.push({ ...f, tool });
					});
				}
			});
			allGeneratedFiles = files;
		});
		return unsubscribe;
	});

	function viewFile(file: {name: string, type: string}) {
		const content = fileContents[file.name];
		if (file.type === 'html' && content) {
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(content);
				newWindow.document.close();
			}
		} else if (content) {
			alert(`File: ${file.name}\n\n${content}`);
		} else if (file.type === 'png') {
			alert(`${file.name}\n\nImage preview not available in training mode.`);
		} else {
			alert(`${file.name}\n\nThis is a simulated file in the training environment.`);
		}
		filesDropdownOpen = false;
	}

	function startResize(e: MouseEvent) {
		isResizing = true;
		document.addEventListener('mousemove', handleResize);
		document.addEventListener('mouseup', stopResize);
	}

	function handleResize(e: MouseEvent) {
		if (!isResizing) return;
		const container = document.getElementById('left-panel');
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
		terminalHeight = Math.max(30, Math.min(85, newHeight));
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', handleResize);
		document.removeEventListener('mouseup', stopResize);
	}

	function closeDropdown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.files-dropdown')) {
			filesDropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={closeDropdown} />

<div class="h-screen w-screen flex flex-col overflow-hidden">
	<!-- Top Header Bar -->
	<div class="h-10 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700">
		<div class="flex items-center gap-2">
			<span class="text-green-400 font-bold text-sm">🧬 BioLearn</span>
			<span class="text-gray-400 text-xs">| Bioinformatics Training Platform</span>
		</div>

		<!-- Files Dropdown -->
		<div class="files-dropdown relative">
			<button
				class="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
				onclick={() => filesDropdownOpen = !filesDropdownOpen}
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
				Output Files ({allGeneratedFiles.length})
				<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{#if filesDropdownOpen}
				<div class="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-auto">
					{#if allGeneratedFiles.length === 0}
						<div class="p-4 text-gray-500 text-sm text-center">
							No output files yet.<br/>
							<span class="text-xs">Run a tool to generate files.</span>
						</div>
					{:else}
						<div class="p-2 bg-gray-50 border-b text-xs text-gray-600 font-medium">
							{allGeneratedFiles.length} files generated
						</div>
						{#each allGeneratedFiles as file}
							<button
								class="w-full px-3 py-2 flex items-center gap-3 hover:bg-blue-50 text-left border-b border-gray-100 last:border-0"
								onclick={() => viewFile(file)}
							>
								<span class="text-lg">
									{#if file.type === 'html'}📄
									{:else if file.type === 'png'}🖼️
									{:else if file.type === 'zip'}📦
									{:else if file.type === 'fasta' || file.type === 'fastq'}🧬
									{:else if file.type === 'tsv' || file.type === 'txt'}📋
									{:else if file.type === 'log'}📝
									{:else if file.type === 'gfa'}🔗
									{:else}📁{/if}
								</span>
								<div class="flex-1 min-w-0">
									<p class="text-sm text-gray-800 truncate">{file.name}</p>
									<p class="text-xs text-gray-500">{file.tool} • {file.type.toUpperCase()}</p>
								</div>
								<span class="text-blue-500 text-xs">View</span>
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left Panel: Terminal + Output -->
		<div id="left-panel" class="w-1/2 flex flex-col border-r border-gray-300">
		<!-- Terminal -->
		<div
			class="terminal-panel overflow-hidden"
			style="height: {terminalHeight}%"
		>
			<Terminal />
		</div>

		<!-- Resize Handle -->
		<div
			class="h-1 bg-gray-600 cursor-row-resize hover:bg-blue-500 transition-colors"
			onmousedown={startResize}
			role="separator"
			aria-orientation="horizontal"
			tabindex="0"
		></div>

		<!-- Output Panel -->
		<div
			class="output-panel flex-1 overflow-auto"
			style="height: {100 - terminalHeight}%"
		>
			<OutputPanel data={outputData} />
		</div>
	</div>

		<!-- Right Panel: Story -->
		<div class="w-1/2 story-panel overflow-auto">
			<StoryPanel content={storyContent} step={currentStep} />
		</div>
	</div>
</div>

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
