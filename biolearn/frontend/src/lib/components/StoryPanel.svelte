<script lang="ts">
	import { executedCommands, executedSteps, currentDirectory } from '$lib/stores/terminal';

	let currentStep = $state(0);
	let completedSteps = $state<Set<number>>(new Set());
	let userCurrentDir = $state('/data/outbreak_investigation');

	// Subscribe to current directory
	currentDirectory.subscribe(dir => {
		userCurrentDir = dir;
	});

	// Subscribe to executed commands to track step completion
	executedCommands.subscribe(cmds => {
		// Map commands to steps
		if (cmds.includes('fastqc')) completedSteps.add(2);
		if (cmds.includes('trimmomatic')) completedSteps.add(3);
		if (cmds.includes('unicycler')) completedSteps.add(4);
		completedSteps = new Set(completedSteps);
	});

	// Brief narrative content
	const sampleNarrative = {
		title: 'Hospital Outbreak Investigation',
		subtitle: 'WGS Analysis Pipeline',
		sections: [
			{
				type: 'intro',
				text: `UM Medical Centre Saturday Report: 5 patients in the ICU did not respond to antibiotics, suspected to have developed antimicrobial resistance within the past 72 hours.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Samples were collected and sent for whole genome sequencing. Data has been released to you. Your task is to analyze the bacterial genomes to determine if this is an outbreak and identify the source.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'task',
				title: 'Step 1: Quality Control',
				text: `Check the quality of raw sequencing data (FASTQ files).`,
				command: 'fastqc sample_01_R1.fastq.gz -o qc_reports/',
				explanation: 'FastQC generates quality reports for raw sequence data',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'sample_01_R1.fastq.gz', desc: 'Input FASTQ file (forward reads)' },
					{ name: '-o qc_reports/', desc: 'Output directory for QC reports' }
				]
			},
			{
				type: 'task',
				title: 'Step 2: Read Trimming',
				text: `Remove adapter sequences and low-quality bases from reads.`,
				command: 'trimmomatic PE -phred33 sample_01_R1.fastq.gz sample_01_R2.fastq.gz trimmed/sample_01_R1_paired.fq.gz trimmed/sample_01_R1_unpaired.fq.gz trimmed/sample_01_R2_paired.fq.gz trimmed/sample_01_R2_unpaired.fq.gz ILLUMINACLIP:TruSeq3-PE.fa:2:30:10 SLIDINGWINDOW:4:15 MINLEN:36',
				explanation: 'Trimmomatic cleans reads by removing adapters and trimming poor-quality bases',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: 'PE', desc: 'Paired-end mode (R1 + R2 reads)' },
					{ name: '-phred33', desc: 'Quality score encoding (standard Illumina)' },
					{ name: 'ILLUMINACLIP:TruSeq3-PE.fa:2:30:10', desc: 'Remove Illumina adapters (seed=2, palindrome=30, simple=10)' },
					{ name: 'SLIDINGWINDOW:4:15', desc: 'Cut when 4bp window average quality < 15' },
					{ name: 'MINLEN:36', desc: 'Drop reads shorter than 36bp' }
				]
			},
			{
				type: 'task',
				title: 'Step 3: Genome Assembly',
				text: `Assemble cleaned reads into contiguous sequences (contigs).`,
				command: 'unicycler -1 trimmed/sample_01_R1_paired.fq.gz -2 trimmed/sample_01_R2_paired.fq.gz -o assembly/',
				explanation: 'Unicycler assembles bacterial genomes and can circularize chromosomes and plasmids',
				requiredDir: '/data/outbreak_investigation',
				parameters: [
					{ name: '-1', desc: 'Forward reads (R1) input file' },
					{ name: '-2', desc: 'Reverse reads (R2) input file' },
					{ name: '-o assembly/', desc: 'Output directory for assembly results' }
				]
			}
		]
	};

	// Check if user is in the correct directory for a task
	function isInCorrectDir(requiredDir: string | null): boolean {
		if (!requiredDir) return true;
		return userCurrentDir === requiredDir;
	}

	// Get short directory name for display
	function getShortDir(dir: string): string {
		return dir.replace('/data/outbreak_investigation', '~');
	}

	// Check if user can proceed to next step
	function canProceed(stepIndex: number): boolean {
		if (stepIndex <= 1) return true; // Intro and context are always visible
		// For task steps, check if previous task step is completed
		const prevTaskIndex = stepIndex - 1;
		if (prevTaskIndex <= 1) return true;
		return completedSteps.has(prevTaskIndex);
	}

	function nextStep() {
		const nextIdx = currentStep + 1;
		if (nextIdx < sampleNarrative.sections.length && canProceed(nextIdx)) {
			currentStep = nextIdx;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep--;
		}
	}

	function goToStep(index: number) {
		if (canProceed(index)) {
			currentStep = index;
		}
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
						<div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
							<p class="text-gray-700 leading-relaxed font-medium">{section.text}</p>
						</div>
					{:else if section.type === 'context'}
						<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
							<p class="text-gray-700">{section.text}</p>
						</div>
					{:else if section.type === 'task'}
						<div class="bg-gray-50 rounded-lg p-4 border border-gray-200" class:border-green-400={completedSteps.has(i)} class:bg-green-50={completedSteps.has(i)}>
							<div class="flex items-center justify-between mb-2">
								{#if section.title}
									<h3 class="font-semibold text-gray-800">📋 {section.title}</h3>
								{/if}
								{#if completedSteps.has(i)}
									<span class="text-green-600 text-sm font-medium">✓ Completed</span>
								{/if}
							</div>
							<p class="text-gray-700 mb-3">{section.text}</p>

							{#if section.command}
								<!-- Directory check warning -->
								{#if section.requiredDir && !isInCorrectDir(section.requiredDir) && !completedSteps.has(i)}
									<div class="bg-amber-50 border border-amber-300 rounded p-3 mb-3">
										<div class="flex items-start gap-2">
											<span class="text-amber-500">⚠️</span>
											<div class="flex-1">
												<p class="text-amber-800 text-sm font-medium">Wrong directory</p>
												<p class="text-amber-700 text-sm">
													You are in <code class="bg-amber-100 px-1 rounded">{getShortDir(userCurrentDir)}</code>
												</p>
												<p class="text-amber-700 text-sm mt-1">First, run this command:</p>
												<div class="bg-gray-900 rounded p-2 mt-1 font-mono text-sm">
													<code class="text-yellow-400">cd {section.requiredDir}</code>
												</div>
											</div>
										</div>
									</div>
								{:else if section.requiredDir && isInCorrectDir(section.requiredDir) && !completedSteps.has(i)}
									<div class="flex items-center gap-2 text-green-600 text-sm mb-2">
										<span>✓</span>
										<span>You are in the correct directory ({getShortDir(section.requiredDir)})</span>
									</div>
								{/if}

								<div class="bg-gray-900 rounded p-3 font-mono text-sm overflow-x-auto mb-3">
									<div class="text-gray-400 text-xs mb-1">Command:</div>
									<code class="text-green-400 whitespace-pre-wrap break-all">{section.command}</code>
								</div>

								{#if section.parameters && section.parameters.length > 0}
									<div class="bg-white rounded border border-gray-200 p-3 mb-3">
										<div class="text-xs font-semibold text-gray-500 uppercase mb-2">Parameter Reference</div>
										<dl class="space-y-1 text-sm">
											{#each section.parameters as param}
												<div class="flex">
													<dt class="font-mono text-blue-600 min-w-[180px] flex-shrink-0">{param.name}</dt>
													<dd class="text-gray-600">{param.desc}</dd>
												</div>
											{/each}
										</dl>
									</div>
								{/if}

								{#if section.explanation}
									<p class="text-gray-500 text-sm italic">
										ℹ️ {section.explanation}
									</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/each}

		<!-- Next step locked message -->
		{#if currentStep < sampleNarrative.sections.length - 1 && !canProceed(currentStep + 1)}
			<div class="text-center py-4 text-gray-500 border-t border-dashed">
				<span class="text-lg">🔒</span>
				<p class="text-sm mt-1">Execute the current command to unlock the next step</p>
			</div>
		{/if}
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
					class="w-3 h-3 rounded-full transition-colors"
					class:bg-blue-600={i <= currentStep && canProceed(i)}
					class:bg-green-500={completedSteps.has(i)}
					class:bg-gray-300={i > currentStep || !canProceed(i)}
					class:cursor-pointer={canProceed(i)}
					class:cursor-not-allowed={!canProceed(i)}
					class:hover:scale-110={canProceed(i)}
					onclick={() => goToStep(i)}
					aria-label="Go to step {i + 1}"
					disabled={!canProceed(i)}
				></button>
			{/each}
		</div>
		<button
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentStep >= sampleNarrative.sections.length - 1 || !canProceed(currentStep + 1)}
			onclick={nextStep}
		>
			{#if currentStep < sampleNarrative.sections.length - 1 && !canProceed(currentStep + 1)}
				🔒 Next
			{:else}
				Next →
			{/if}
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
