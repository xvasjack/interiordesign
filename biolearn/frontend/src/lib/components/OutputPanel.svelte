<script lang="ts">
	import { onMount } from 'svelte';

	let {
		data = null
	}: {
		data?: any;
	} = $props();

	let plotContainer: HTMLDivElement;
	let activeTab = $state('chart');

	// Sample data for demonstration
	const sampleQCData = {
		type: 'fastqc',
		title: 'Sequence Quality Report',
		summary: {
			totalSequences: '2,456,789',
			sequenceLength: '150 bp',
			gcContent: '52%',
			qualityScore: 'Pass'
		},
		qualityScores: {
			positions: Array.from({ length: 150 }, (_, i) => i + 1),
			scores: Array.from({ length: 150 }, () => Math.random() * 10 + 28)
		}
	};

	async function renderChart() {
		if (!plotContainer) return;

		// Dynamic import Plotly to avoid SSR issues
		const Plotly = await import('plotly.js-dist-min');

		const trace = {
			x: sampleQCData.qualityScores.positions,
			y: sampleQCData.qualityScores.scores,
			type: 'scatter',
			mode: 'lines',
			fill: 'tozeroy',
			fillcolor: 'rgba(78, 201, 176, 0.3)',
			line: {
				color: '#4ec9b0',
				width: 2
			},
			name: 'Quality Score'
		};

		const layout = {
			title: {
				text: 'Per Base Sequence Quality',
				font: { size: 14 }
			},
			xaxis: {
				title: 'Position in read (bp)',
				gridcolor: '#e5e7eb'
			},
			yaxis: {
				title: 'Quality Score (Phred)',
				range: [0, 42],
				gridcolor: '#e5e7eb'
			},
			shapes: [
				{
					type: 'rect',
					xref: 'paper',
					yref: 'y',
					x0: 0,
					y0: 28,
					x1: 1,
					y1: 42,
					fillcolor: 'rgba(34, 197, 94, 0.1)',
					line: { width: 0 }
				},
				{
					type: 'rect',
					xref: 'paper',
					yref: 'y',
					x0: 0,
					y0: 20,
					x1: 1,
					y1: 28,
					fillcolor: 'rgba(234, 179, 8, 0.1)',
					line: { width: 0 }
				},
				{
					type: 'rect',
					xref: 'paper',
					yref: 'y',
					x0: 0,
					y0: 0,
					x1: 1,
					y1: 20,
					fillcolor: 'rgba(239, 68, 68, 0.1)',
					line: { width: 0 }
				}
			],
			margin: { t: 40, r: 20, b: 50, l: 60 },
			paper_bgcolor: 'transparent',
			plot_bgcolor: 'transparent',
			font: { family: 'system-ui, sans-serif' }
		};

		const config = {
			responsive: true,
			displayModeBar: true,
			modeBarButtonsToRemove: ['lasso2d', 'select2d'],
			displaylogo: false
		};

		Plotly.default.newPlot(plotContainer, [trace], layout, config);
	}

	onMount(() => {
		renderChart();
	});
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
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-4">
		{#if activeTab === 'chart'}
			<div bind:this={plotContainer} class="w-full h-full min-h-[200px]"></div>
		{:else if activeTab === 'table'}
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="px-4 py-3 border-b">
					<h3 class="font-semibold text-gray-800">{sampleQCData.title}</h3>
				</div>
				<div class="p-4">
					<dl class="grid grid-cols-2 gap-4">
						<div>
							<dt class="text-sm text-gray-500">Total Sequences</dt>
							<dd class="text-lg font-semibold text-gray-800">
								{sampleQCData.summary.totalSequences}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">Sequence Length</dt>
							<dd class="text-lg font-semibold text-gray-800">
								{sampleQCData.summary.sequenceLength}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">GC Content</dt>
							<dd class="text-lg font-semibold text-gray-800">
								{sampleQCData.summary.gcContent}
							</dd>
						</div>
						<div>
							<dt class="text-sm text-gray-500">Overall Quality</dt>
							<dd class="text-lg font-semibold">
								<span class="text-green-600 bg-green-100 px-2 py-1 rounded">
									{sampleQCData.summary.qualityScore}
								</span>
							</dd>
						</div>
					</dl>
				</div>
			</div>
		{:else if activeTab === 'files'}
			<div class="bg-white rounded-lg shadow-sm border">
				<div class="px-4 py-3 border-b">
					<h3 class="font-semibold text-gray-800">Generated Files</h3>
				</div>
				<ul class="divide-y">
					<li class="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
						<div class="flex items-center gap-3">
							<span class="text-2xl">📄</span>
							<div>
								<p class="font-medium text-gray-800">sample_01_fastqc.html</p>
								<p class="text-sm text-gray-500">HTML Report • 245 KB</p>
							</div>
						</div>
						<button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
							View
						</button>
					</li>
					<li class="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
						<div class="flex items-center gap-3">
							<span class="text-2xl">📦</span>
							<div>
								<p class="font-medium text-gray-800">sample_01_fastqc.zip</p>
								<p class="text-sm text-gray-500">Archive • 1.2 MB</p>
							</div>
						</div>
						<button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
							Download
						</button>
					</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
