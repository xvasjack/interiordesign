<script lang="ts">
	let currentStep = $state(0);

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
				title: 'Quality Control',
				text: `First, let's check the quality of our sequencing data. We've received FASTQ files from the sequencer.`,
				command: 'fastqc sample_01.fastq.gz -o qc_reports/',
				explanation: 'FastQC analyzes raw sequence data and generates quality reports'
			},
			{
				type: 'task',
				title: 'Read Trimming',
				text: `The quality report shows some adapter contamination. Let's trim the reads to remove adapters and low-quality bases.`,
				command: 'trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz output_paired_R1.fq.gz output_unpaired_R1.fq.gz output_paired_R2.fq.gz output_unpaired_R2.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 LEADING:3 TRAILING:3 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Trimmomatic removes adapter sequences and trims low-quality bases'
			},
			{
				type: 'task',
				title: 'Genome Assembly',
				text: `Now we'll assemble the cleaned reads into contiguous sequences (contigs) that represent the bacterial genome.`,
				command: 'unicycler -1 output_paired_R1.fq.gz -2 output_paired_R2.fq.gz -o assembly/',
				explanation: 'Unicycler is optimized for bacterial genome assembly and can produce circular contigs'
			}
		]
	};

	function nextStep() {
		if (currentStep < sampleNarrative.sections.length - 1) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function goToStep(index: number) {
		currentStep = index;
	}
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
	<div class="bg-gray-100 px-6 py-3 border-b border-gray-200">
		<div class="flex items-center justify-between text-sm text-gray-600 mb-2">
			<span>Progress</span>
			<span>Step {currentStep + 1} of {sampleNarrative.sections.length}</span>
		</div>
		<div class="w-full bg-gray-200 rounded-full h-2">
			<div
				class="bg-blue-600 h-2 rounded-full transition-all duration-300"
				style="width: {((currentStep + 1) / sampleNarrative.sections.length) * 100}%"
			></div>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-6">
		{#each sampleNarrative.sections as section, i}
			{#if i <= currentStep}
				<div class="mb-6 animate-fade-in" class:opacity-50={i < currentStep}>
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
						<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
							{#if section.title}
								<h3 class="font-semibold text-gray-800 mb-2">📋 {section.title}</h3>
							{/if}
							<p class="text-gray-700 mb-4">{section.text}</p>

							{#if section.command}
								<div class="bg-gray-900 rounded p-3 font-mono text-sm overflow-x-auto">
									<div class="text-gray-400 text-xs mb-1">Try this command:</div>
									<code class="text-green-400 whitespace-pre-wrap break-all">{section.command}</code>
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
	<div class="border-t border-gray-200 bg-gray-50 p-4 flex justify-between items-center">
		<button
			class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentStep === 0}
			onclick={prevStep}
		>
			← Previous
		</button>
		<div class="flex gap-2">
			{#each sampleNarrative.sections as _, i}
				<button
					class="w-3 h-3 rounded-full transition-colors cursor-pointer hover:scale-110"
					class:bg-blue-600={i <= currentStep}
					class:bg-gray-300={i > currentStep}
					onclick={() => goToStep(i)}
					aria-label="Go to step {i + 1}"
				></button>
			{/each}
		</div>
		<button
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentStep >= sampleNarrative.sections.length - 1}
			onclick={nextStep}
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
