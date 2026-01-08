<script lang="ts">
	import { onMount } from 'svelte';
	import { outputData, terminalState, fileNotes } from '$lib/stores/terminal';

	let plotContainer: HTMLDivElement;
	let activeTab = $state('chart');
	let currentOutput = $state<any>(null);
	let isLoading = $state(false);
	let loadingProgress = $state(0);
	let loadingTool = $state('');
	let currentNotes = $state<any[]>([]);

	// Subscribe to stores
	onMount(() => {
		const unsubOutput = outputData.subscribe(data => {
			currentOutput = data;
			if (data && data.chartData) {
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

	function viewFile(file: any) {
		// For HTML files, show in a new window or modal
		if (file.type === 'html') {
			alert(`Viewing ${file.name}\n\nIn a real application, this would open the HTML report in a new tab or modal.`);
		} else {
			alert(`Preview not available for ${file.type.toUpperCase()} files.\n\nIn a real application, this would show a preview or text content.`);
		}
	}

	function downloadFile(file: any) {
		// Simulate download
		const blob = new Blob([`Simulated content for ${file.name}`], { type: 'text/plain' });
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

		const trace = {
			x: data.chartData.positions || data.chartData.x,
			y: data.chartData.scores || data.chartData.y,
			type: data.chartData.type || 'scatter',
			mode: 'lines',
			fill: 'tozeroy',
			fillcolor: 'rgba(78, 201, 176, 0.3)',
			line: { color: '#4ec9b0', width: 2 },
			name: data.chartData.name || 'Data'
		};

		const layout = {
			title: { text: data.chartData.title || data.title, font: { size: 14 } },
			xaxis: { title: data.chartData.xLabel || 'X', gridcolor: '#e5e7eb' },
			yaxis: { title: data.chartData.yLabel || 'Y', gridcolor: '#e5e7eb' },
			margin: { t: 40, r: 20, b: 50, l: 60 },
			paper_bgcolor: 'transparent',
			plot_bgcolor: 'transparent',
			font: { family: 'system-ui, sans-serif' }
		};

		Plotly.default.newPlot(plotContainer, [trace], layout, { responsive: true, displaylogo: false });
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
