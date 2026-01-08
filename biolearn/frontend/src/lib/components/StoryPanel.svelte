<script lang="ts">
	let {
		content = '',
		step = 0
	}: {
		content?: string;
		step?: number;
	} = $props();

	// Sample narrative content for demonstration
	const sampleNarrative = {
		title: 'Hospital Outbreak Investigation',
		subtitle: 'A mysterious cluster of infections',
		sections: [
			{
				type: 'intro',
				text: `It's Monday morning at St. Mary's Hospital. Dr. Sarah Chen reviews the weekend reports and notices something unusual: five patients in the ICU have developed similar antibiotic-resistant infections within the past 72 hours.`,
				hint: null
			},
			{
				type: 'context',
				text: `The infection control team has collected samples and sent them for whole genome sequencing. Your task is to analyze these bacterial genomes to determine if this is an outbreak and identify the source.`,
				hint: 'You will use WGS analysis to trace the outbreak'
			},
			{
				type: 'task',
				text: `First, let's check the quality of our sequencing data. We've received FASTQ files from the sequencer.`,
				command: 'fastqc sample_01.fastq.gz -o qc_reports/',
				explanation: 'FastQC analyzes raw sequence data and generates quality reports'
			}
		]
	};
</script>

<div class="h-full flex flex-col">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
		<div class="flex items-center gap-3 mb-2">
			<span class="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
				WGS Analysis
			</span>
			<span class="bg-green-500/80 px-3 py-1 rounded-full text-sm font-medium">
				Phase 1: Quality Control
			</span>
		</div>
		<h1 class="text-2xl font-bold">{sampleNarrative.title}</h1>
		<p class="text-blue-100 mt-1">{sampleNarrative.subtitle}</p>
	</div>

	<!-- Progress Bar -->
	<div class="bg-gray-100 px-6 py-3 border-b">
		<div class="flex items-center justify-between text-sm text-gray-600 mb-2">
			<span>Progress</span>
			<span>Step {step + 1} of {sampleNarrative.sections.length}</span>
		</div>
		<div class="w-full bg-gray-200 rounded-full h-2">
			<div
				class="bg-blue-600 h-2 rounded-full transition-all duration-300"
				style="width: {((step + 1) / sampleNarrative.sections.length) * 100}%"
			></div>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-6">
		{#each sampleNarrative.sections as section, i}
			{#if i <= step}
				<div class="mb-6 animate-fade-in" class:opacity-50={i < step}>
					{#if section.type === 'intro'}
						<div class="prose prose-lg">
							<p class="text-gray-700 leading-relaxed">{section.text}</p>
						</div>
					{:else if section.type === 'context'}
						<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
							<p class="text-gray-700">{section.text}</p>
							{#if section.hint}
								<p class="text-blue-600 text-sm mt-2 font-medium">
									💡 {section.hint}
								</p>
							{/if}
						</div>
					{:else if section.type === 'task'}
						<div class="bg-gray-50 rounded-lg p-4 border">
							<h3 class="font-semibold text-gray-800 mb-2">Your Task</h3>
							<p class="text-gray-700 mb-4">{section.text}</p>

							{#if section.command}
								<div class="bg-gray-900 rounded p-3 font-mono text-sm">
									<div class="text-gray-400 text-xs mb-1">Try this command:</div>
									<code class="text-green-400">{section.command}</code>
								</div>
								{#if section.explanation}
									<p class="text-gray-500 text-sm mt-2 italic">
										{section.explanation}
									</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<!-- Navigation -->
	<div class="border-t bg-gray-50 p-4 flex justify-between items-center">
		<button
			class="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
			disabled={step === 0}
		>
			← Previous
		</button>
		<div class="flex gap-2">
			{#each sampleNarrative.sections as _, i}
				<div
					class="w-2 h-2 rounded-full transition-colors"
					class:bg-blue-600={i <= step}
					class:bg-gray-300={i > step}
				></div>
			{/each}
		</div>
		<button
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
			disabled={step >= sampleNarrative.sections.length - 1}
		>
			Next →
		</button>
	</div>
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
