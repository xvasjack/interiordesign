<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { outputData, terminalState, fileNotes, stopSignal } from '$lib/stores/terminal';

	let plotContainer: HTMLDivElement;
	let activeTab = $state('chart');
	let currentOutput = $state<any>(null);
	let isLoading = $state(false);
	let loadingProgress = $state(0);
	let loadingTool = $state('');
	let currentNotes = $state<any[]>([]);
	let chartRendered = $state(false);

	function handleStop() {
		// Increment stop signal to trigger cancellation
		stopSignal.update(n => n + 1);
	}

	// Re-render chart when switching to chart tab
	$effect(() => {
		if (activeTab === 'chart' && currentOutput?.chartData && plotContainer) {
			// Use tick to ensure DOM is updated before rendering
			tick().then(() => {
				renderChart(currentOutput);
			});
		}
	});

	// Subscribe to stores
	onMount(() => {
		const unsubOutput = outputData.subscribe(data => {
			currentOutput = data;
			chartRendered = false;
			if (data && data.chartData && activeTab === 'chart') {
				setTimeout(() => renderChart(data), 100);
			}
			// Update notes for the current tool
			if (data?.type) {
				currentNotes = fileNotes[data.type] || [];
			} else {
				currentNotes = [];
			}
		});

		const unsubTerminal = terminalState.subscribe(state => {
			isLoading = state.isRunning;
			loadingProgress = state.progress;
			loadingTool = state.currentCommand.split(' ')[0] || '';
		});

		return () => {
			unsubOutput();
			unsubTerminal();
		};
	});

	// Sample file contents for different file types
	const fileContents: Record<string, string> = {
		// SeqKit stats
		'seqkit_stats.txt': `file\tformat\ttype\tnum_seqs\tsum_len\tmin_len\tavg_len\tmax_len\nsample_01_R1.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150\nsample_01_R2.fastq.gz\tFASTQ\tDNA\t2,847,293\t427,093,950\t150\t150\t150`,

		// FastQC reports
		'sample_01_R1_fastqc.html': `<!DOCTYPE html><html><head><title>FastQC Report - sample_01_R1</title><style>body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;} .summary{background:#f5f5f5;padding:15px;border-radius:5px;} .pass{color:green;} .warn{color:orange;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:8px;}</style></head><body><h1>FastQC Report</h1><div class="summary"><h2>Summary</h2><p><span class="pass">✓</span> Basic Statistics</p><p><span class="pass">✓</span> Per base sequence quality</p><p><span class="pass">✓</span> Per sequence quality scores</p><p><span class="pass">✓</span> Per base sequence content</p><p><span class="warn">⚠</span> Per sequence GC content</p><p><span class="pass">✓</span> Per base N content</p></div><h2>Basic Statistics</h2><table><tr><th>Measure</th><th>Value</th></tr><tr><td>Filename</td><td>sample_01_R1.fastq.gz</td></tr><tr><td>Total Sequences</td><td>2,847,293</td></tr><tr><td>Sequence Length</td><td>150</td></tr><tr><td>%GC</td><td>52</td></tr></table></body></html>`,
		'sample_01_R2_fastqc.html': `<!DOCTYPE html><html><head><title>FastQC Report - sample_01_R2</title><style>body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;} .summary{background:#f5f5f5;padding:15px;border-radius:5px;} .pass{color:green;} .warn{color:orange;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:8px;}</style></head><body><h1>FastQC Report</h1><div class="summary"><h2>Summary</h2><p><span class="pass">✓</span> Basic Statistics</p><p><span class="pass">✓</span> Per base sequence quality</p><p><span class="pass">✓</span> Per sequence quality scores</p><p><span class="pass">✓</span> Per base sequence content</p><p><span class="warn">⚠</span> Per sequence GC content</p><p><span class="pass">✓</span> Per base N content</p></div><h2>Basic Statistics</h2><table><tr><th>Measure</th><th>Value</th></tr><tr><td>Filename</td><td>sample_01_R2.fastq.gz</td></tr><tr><td>Total Sequences</td><td>2,847,293</td></tr><tr><td>Sequence Length</td><td>150</td></tr><tr><td>%GC</td><td>52</td></tr></table></body></html>`,
		'sample_01_R1_fastqc.zip': 'FASTQC_ZIP_PLACEHOLDER',
		'sample_01_R2_fastqc.zip': 'FASTQC_ZIP_PLACEHOLDER',

		// Trimmomatic outputs
		'sample_01_R1_paired.fq.gz': `@SEQ_ID_1\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\n@SEQ_ID_2\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII`,
		'sample_01_R2_paired.fq.gz': `@SEQ_ID_1\nTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTA\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII\n@SEQ_ID_2\nCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n+\nIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII`,
		'sample_01_R1_unpaired.fq.gz': `@UNPAIRED_1\nATGCATGCATGCATGC\n+\nIIIIIIIIIIIIIIII`,
		'sample_01_R2_unpaired.fq.gz': `@UNPAIRED_1\nGCATGCATGCATGCAT\n+\nIIIIIIIIIIIIIIII`,

		// Unicycler outputs
		'assembly.fasta': `>contig_1 length=4892156 depth=45.2x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG\nTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\n>contig_2 length=95234 depth=78.5x circular=true\nATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\nGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAG`,
		'assembly.gfa': `H\tVN:Z:1.0\nS\t1\tATGCGTACGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT\tLN:i:4892156\tRC:i:221089472\nS\t2\tGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC\tLN:i:95234\tRC:i:7476869\nL\t1\t+\t1\t+\t0M\nL\t2\t+\t2\t+\t0M`,
		'unicycler.log': `[2024-01-15 10:23:45] Starting Unicycler v0.5.0\n[2024-01-15 10:23:45] Command: unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly\n[2024-01-15 10:23:46] Input files validated\n[2024-01-15 10:23:47] Read count: 2,683,521 (forward), 2,683,521 (reverse)\n[2024-01-15 10:24:15] SPAdes assembly completed\n[2024-01-15 10:24:45] Rotating contigs to standard start\n[2024-01-15 10:25:00] Polishing assembly with Pilon\n[2024-01-15 10:25:12] Assembly completed successfully\n[2024-01-15 10:25:12] Final assembly: 2 contigs, total length 4,987,390 bp`,

		// Bandage output (base64 placeholder for PNG)
		'assembly_graph.png': 'PNG_IMAGE_PLACEHOLDER',

		// QUAST outputs
		'quast_report.tsv': `Assembly\t# contigs\tTotal length\tLargest contig\tGC (%)\tN50\tN75\tL50\tL75\n# misassemblies\t# misassembled contigs\nsample_01\t2\t4987390\t4892156\t52.3\t4892156\t95234\t1\t2\t0\t0`,
		'quast_report.html': `<!DOCTYPE html><html><head><title>QUAST Report</title><style>body{font-family:Arial,sans-serif;margin:20px;} h1{color:#333;} table{border-collapse:collapse;width:100%;margin:20px 0;} td,th{border:1px solid #ddd;padding:12px;text-align:left;} th{background:#4CAF50;color:white;} tr:nth-child(even){background:#f2f2f2;} .good{color:green;font-weight:bold;}</style></head><body><h1>QUAST Quality Assessment Report</h1><h2>Assembly Statistics</h2><table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total contigs</td><td class="good">2</td></tr><tr><td>Total length</td><td>4,987,390 bp</td></tr><tr><td>Largest contig</td><td>4,892,156 bp</td></tr><tr><td>GC content</td><td>52.3%</td></tr><tr><td>N50</td><td class="good">4,892,156 bp</td></tr><tr><td>N75</td><td>95,234 bp</td></tr></table><h2>Conclusion</h2><p>Assembly quality: <span class="good">EXCELLENT</span> - Complete circular chromosome with one plasmid detected.</p></body></html>`,

		// Abricate outputs
		'amr_report.tsv': `#FILE\tSEQUENCE\tSTART\tEND\tSTRAND\tGENE\tCOVERAGE\tCOVERAGE_MAP\tGAPS\t%COVERAGE\t%IDENTITY\tDATABASE\tACCESSION\tPRODUCT\tRESISTANCE\nassembly.fasta\tcontig_1\t1245678\t1246523\t+\tblaCTX-M-15\t1-846/846\t===============\t0/0\t100.00\t99.89\tncbi\tNG_049557.1\tclass A extended-spectrum beta-lactamase CTX-M-15\tCephalosporin\nassembly.fasta\tcontig_2\t52345\t53567\t+\ttet(A)\t1-1223/1223\t===============\t0/0\t100.00\t100.00\tncbi\tAF534183.1\ttetracycline efflux MFS transporter Tet(A)\tTetracycline`,
		'amr_summary.txt': `AMR Gene Summary Report\n=======================\nGenerated: 2024-01-15\nSample: sample_01\nDatabase: NCBI AMRFinderPlus\n\nTotal AMR genes found: 2\n\n1. blaCTX-M-15 (Beta-lactamase)\n   Location: contig_1:1245678-1246523\n   Coverage: 100.00%\n   Identity: 99.89%\n   Resistance: Extended-spectrum cephalosporins (3rd/4th generation)\n   Clinical significance: HIGH - Associated with hospital-acquired infections\n\n2. tet(A) (Tetracycline efflux pump)\n   Location: contig_2:52345-53567  \n   Coverage: 100.00%\n   Identity: 100.00%\n   Resistance: Tetracycline, Doxycycline\n   Clinical significance: MODERATE\n\nRecommendation: Avoid cephalosporins and tetracyclines for treatment.`
	};

	// MIME types for different file extensions
	const mimeTypes: Record<string, string> = {
		'html': 'text/html',
		'txt': 'text/plain',
		'tsv': 'text/tab-separated-values',
		'fasta': 'text/plain',
		'gfa': 'text/plain',
		'log': 'text/plain',
		'png': 'image/png',
		'zip': 'application/zip',
		'gff': 'text/plain',
		'gbk': 'text/plain',
		'fna': 'text/plain',
		'faa': 'text/plain',
		'ffn': 'text/plain'
	};

	function viewFile(file: any) {
		const content = fileContents[file.name];
		if (file.type === 'html' && content) {
			// Open HTML in new window
			const newWindow = window.open('', '_blank');
			if (newWindow) {
				newWindow.document.write(content);
				newWindow.document.close();
			}
		} else if (content) {
			// Show text content in alert (could be improved with modal)
			alert(`File: ${file.name}\n\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`);
		} else {
			alert(`Preview not available for ${file.name}\n\nThis is a simulated file in the training environment.`);
		}
	}

	function downloadFile(file: any) {
		const content = fileContents[file.name] || `# Simulated content for ${file.name}\n# This file was generated in the BioLearn training environment`;
		const mimeType = mimeTypes[file.type] || 'text/plain';
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	async function renderChart(data: any) {
		if (!plotContainer || !data?.chartData) return;

		const Plotly = await import('plotly.js-dist-min');
		const chartData = data.chartData;

		let traces: any[] = [];
		let layout: any = {
			title: {
				text: chartData.title || data.title,
				font: { size: 16, color: '#1f2937' }
			},
			xaxis: {
				title: { text: chartData.xLabel || 'X', font: { size: 12, color: '#4b5563' } },
				gridcolor: '#e5e7eb',
				tickfont: { size: 11, color: '#6b7280' }
			},
			yaxis: {
				title: { text: chartData.yLabel || 'Y', font: { size: 12, color: '#4b5563' } },
				gridcolor: '#e5e7eb',
				tickfont: { size: 11, color: '#6b7280' }
			},
			margin: { t: 50, r: 30, b: 60, l: 80 },
			paper_bgcolor: 'transparent',
			plot_bgcolor: '#fafafa',
			font: { family: 'system-ui, sans-serif' },
			showlegend: false
		};

		if (chartData.type === 'assemblyGraph') {
			// Assembly graph visualization - circular diagrams for complete genomes
			const components = chartData.components || [];
			const stats = chartData.graphStats || {};

			// Calculate circle sizes based on component sizes
			const maxSize = Math.max(...components.map((c: any) => c.size));

			const shapes: any[] = [];
			const annotations: any[] = [];

			// Fixed positions - labels at same Y, circles above with bottom edge aligned
			const labelY = 2.0;           // All labels at same Y
			const circleBottomY = 3.2;    // All circle bottoms at same Y

			components.forEach((comp: any, i: number) => {
				// X position: spread further apart
				const xPos = i === 0 ? 2 : 10;

				// Scale radius based on size
				const relativeSize = comp.size / maxSize;
				const radius = Math.max(0.5, 1.4 * Math.sqrt(relativeSize));

				// Circle center: bottom edge at circleBottomY, so center is at circleBottomY + radius
				const yCenter = circleBottomY + radius;

				if (comp.circular) {
					shapes.push({
						type: 'circle',
						xref: 'x',
						yref: 'y',
						x0: xPos - radius,
						y0: circleBottomY,
						x1: xPos + radius,
						y1: circleBottomY + 2 * radius,
						line: { color: comp.color, width: 4 },
						fillcolor: 'rgba(255,255,255,0)'
					});
				} else {
					shapes.push({
						type: 'line',
						xref: 'x',
						yref: 'y',
						x0: xPos - radius,
						y0: yCenter,
						x1: xPos + radius,
						y1: yCenter,
						line: { color: comp.color, width: 4 }
					});
				}

				// Label at fixed Y position, centered under circle
				annotations.push({
					x: xPos,
					y: labelY,
					xref: 'x',
					yref: 'y',
					text: `<b>${comp.name}</b><br>${(comp.size / 1e6).toFixed(2)} Mb`,
					showarrow: false,
					font: { size: 13, color: comp.color },
					align: 'center'
				});
			});

			// Quality badge at top
			const quality = stats.quality || 'unknown';
			const qualityColor = quality === 'excellent' ? '#10b981' : quality === 'good' ? '#f59e0b' : '#ef4444';
			annotations.push({
				x: 6,
				y: 9.2,
				xref: 'x',
				yref: 'y',
				text: `<b>Quality: ${quality.toUpperCase()}</b> | ${stats.circular || 0} circular | ${stats.deadEnds || 0} dead ends`,
				showarrow: false,
				font: { size: 12, color: qualityColor }
			});

			// Node/edge stats at bottom
			annotations.push({
				x: 6,
				y: 0.5,
				xref: 'x',
				yref: 'y',
				text: `Nodes: ${stats.totalNodes?.toLocaleString() || 'N/A'} | Edges: ${stats.totalEdges?.toLocaleString() || 'N/A'}`,
				showarrow: false,
				font: { size: 11, color: '#9ca3af' }
			});

			layout = {
				title: { text: chartData.title, font: { size: 16, color: '#1f2937' } },
				xaxis: { visible: false, range: [0, 12], fixedrange: true, constrain: 'domain' },
				yaxis: { visible: false, range: [0, 10], fixedrange: true, scaleanchor: 'x', scaleratio: 1 },
				margin: { t: 50, r: 20, b: 20, l: 20 },
				paper_bgcolor: 'transparent',
				plot_bgcolor: '#fafafa',
				shapes: shapes,
				annotations: annotations,
				showlegend: false
			};

			// Empty trace to render the plot
			traces.push({
				x: [5],
				y: [5],
				type: 'scatter',
				mode: 'markers',
				marker: { size: 0.1, opacity: 0 }
			});
		} else if (chartData.type === 'bar') {
			// Bar chart for trimmomatic, unicycler
			const colors = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

			traces.push({
				x: chartData.x,
				y: chartData.y,
				type: 'bar',
				marker: {
					color: colors.slice(0, chartData.x.length),
					line: { color: '#1f2937', width: 1 }
				},
				text: chartData.y.map((v: number) => v.toLocaleString()),
				textposition: 'outside',
				textfont: { size: 11, color: '#374151' }
			});

			layout.yaxis.rangemode = 'tozero';
		} else {
			// Line chart for FastQC quality scores
			traces.push({
				x: chartData.positions || chartData.x,
				y: chartData.scores || chartData.y,
				type: 'scatter',
				mode: 'lines',
				fill: 'tozeroy',
				fillcolor: 'rgba(16, 185, 129, 0.2)',
				line: { color: '#10b981', width: 2 },
				name: chartData.name || 'Quality Score'
			});

			// Add quality threshold lines for FastQC
			if (chartData.yLabel?.includes('Phred') || chartData.yLabel?.includes('Quality')) {
				// Q30 line (excellent)
				traces.push({
					x: [1, 150],
					y: [30, 30],
					type: 'scatter',
					mode: 'lines',
					line: { color: '#10b981', width: 1, dash: 'dash' },
					name: 'Q30 (Excellent)',
					showlegend: true
				});
				// Q20 line (acceptable)
				traces.push({
					x: [1, 150],
					y: [20, 20],
					type: 'scatter',
					mode: 'lines',
					line: { color: '#f59e0b', width: 1, dash: 'dash' },
					name: 'Q20 (Acceptable)',
					showlegend: true
				});

				layout.showlegend = true;
				layout.legend = { x: 0.7, y: 0.1, bgcolor: 'rgba(255,255,255,0.8)' };
				layout.yaxis.range = [0, 42];
			}
		}

		Plotly.default.newPlot(plotContainer, traces, layout, {
			responsive: true,
			displaylogo: false,
			modeBarButtonsToRemove: ['lasso2d', 'select2d']
		});
	}
</script>

<div class="h-full flex flex-col bg-gray-50">
	<!-- Tabs -->
	<div class="flex border-b bg-white">
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			class:text-blue-600={activeTab === 'chart'}
			class:border-b-2={activeTab === 'chart'}
			class:border-blue-600={activeTab === 'chart'}
			class:text-gray-600={activeTab !== 'chart'}
			onclick={() => (activeTab = 'chart')}
		>
			📊 Chart
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			class:text-blue-600={activeTab === 'table'}
			class:border-b-2={activeTab === 'table'}
			class:border-blue-600={activeTab === 'table'}
			class:text-gray-600={activeTab !== 'table'}
			onclick={() => (activeTab = 'table')}
		>
			📋 Summary
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			class:text-blue-600={activeTab === 'files'}
			class:border-b-2={activeTab === 'files'}
			class:border-blue-600={activeTab === 'files'}
			class:text-gray-600={activeTab !== 'files'}
			onclick={() => (activeTab = 'files')}
		>
			📁 Files
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors"
			class:text-blue-600={activeTab === 'notes'}
			class:border-b-2={activeTab === 'notes'}
			class:border-blue-600={activeTab === 'notes'}
			class:text-gray-600={activeTab !== 'notes'}
			onclick={() => (activeTab = 'notes')}
		>
			📝 Notes
		</button>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-4">
		{#if isLoading}
			<!-- Loading State -->
			<div class="h-full flex flex-col items-center justify-center text-gray-500">
				<div class="mb-4">
					<svg class="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
				</div>
				<p class="text-lg font-medium text-gray-700">Running {loadingTool}...</p>
				<div class="w-64 mt-4">
					<div class="bg-gray-200 rounded-full h-2">
						<div
							class="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style="width: {loadingProgress}%"
						></div>
					</div>
					<p class="text-sm text-gray-500 mt-2 text-center">{loadingProgress}% complete</p>
				</div>
				<button
					onclick={handleStop}
					class="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<rect x="6" y="6" width="12" height="12" rx="1" stroke-width="2" fill="currentColor"/>
					</svg>
					Stop
				</button>
			</div>
		{:else if !currentOutput}
			<!-- Empty State -->
			<div class="h-full flex flex-col items-center justify-center text-gray-400">
				<svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<p class="text-lg font-medium">No output yet</p>
				<p class="text-sm mt-1">Run a command in the terminal to see results</p>
			</div>
		{:else if activeTab === 'chart'}
			{#if currentOutput.chartData}
				<div bind:this={plotContainer} class="w-full h-full min-h-[200px]"></div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<p>No chart data available for this command</p>
				</div>
			{/if}
		{:else if activeTab === 'table'}
			{#if currentOutput.summary}
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="px-4 py-3 border-b">
						<h3 class="font-semibold text-gray-800">{currentOutput.title}</h3>
						<p class="text-sm text-gray-500">{currentOutput.tool}</p>
					</div>
					<div class="p-4">
						<dl class="grid grid-cols-2 gap-4">
							{#each Object.entries(currentOutput.summary) as [key, value]}
								<div>
									<dt class="text-sm text-gray-500">{key}</dt>
									<dd class="text-lg font-semibold text-gray-800">{value}</dd>
								</div>
							{/each}
						</dl>
					</div>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<p>No summary data available</p>
				</div>
			{/if}
		{:else if activeTab === 'files'}
			{#if currentOutput.files && currentOutput.files.length > 0}
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="px-4 py-3 border-b">
						<h3 class="font-semibold text-gray-800">Generated Files</h3>
					</div>
					<ul class="divide-y">
						{#each currentOutput.files as file}
							<li class="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
								<div class="flex items-center gap-3">
									<span class="text-2xl">{file.type === 'html' ? '📄' : file.type === 'zip' ? '📦' : '📁'}</span>
									<div>
										<p class="font-medium text-gray-800">{file.name}</p>
										<p class="text-sm text-gray-500">{file.type.toUpperCase()} • {file.size}</p>
									</div>
								</div>
								<div class="flex gap-2">
									{#if file.type === 'html'}
										<button
											class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors"
											onclick={() => viewFile(file)}
										>
											View
										</button>
									{/if}
									<button
										class="px-3 py-1 text-green-600 hover:bg-green-50 rounded text-sm font-medium transition-colors"
										onclick={() => downloadFile(file)}
									>
										Download
									</button>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<p>No files generated</p>
				</div>
			{/if}
		{:else if activeTab === 'notes'}
			{#if currentNotes.length > 0}
				<div class="bg-white rounded-lg shadow-sm border">
					<div class="px-4 py-3 border-b">
						<h3 class="font-semibold text-gray-800">File Format Notes</h3>
						<p class="text-sm text-gray-500">Helpful information about the files and formats</p>
					</div>
					<ul class="divide-y">
						{#each currentNotes as note}
							<li class="px-4 py-3">
								<div class="flex items-start gap-3">
									<span class="text-blue-500 mt-0.5">💡</span>
									<div>
										<p class="font-medium text-gray-800">{note.name}</p>
										{#if note.format}
											<span class="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mb-1">{note.format}</span>
										{/if}
										<p class="text-sm text-gray-600">{note.description}</p>
									</div>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{:else}
				<div class="h-full flex items-center justify-center text-gray-400">
					<div class="text-center">
						<p class="mb-2">No notes available</p>
						<p class="text-sm">Run a bioinformatics tool to see file format notes</p>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
