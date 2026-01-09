<script lang="ts">
	import { goto } from '$app/navigation';
	import { executedCommands, executedSteps, currentDirectory } from '$lib/stores/terminal';
	import type { Storyline, StorylineSection } from '$lib/storylines/wgs-bacteria';

	let { storyline = null }: { storyline?: Storyline | null } = $props();

	let currentStep = $state(0);
	let completedSteps = $state<Set<number>>(new Set());
	let userCurrentDir = $state('/data/outbreak_investigation');
	let isFinished = $state(false);
	let selectedDecision = $state<string | null>(null);

	// Default storyline if none provided
	const defaultStoryline: Storyline = {
		id: 'default',
		title: 'Hospital Outbreak Investigation',
		subtitle: 'WGS Analysis Pipeline',
		organism: 'Klebsiella pneumoniae',
		technology: 'illumina',
		toolsUsed: ['fastqc', 'trimmomatic', 'unicycler', 'bandage'],
		sections: [
			{
				type: 'intro',
				text: `UM Medical Centre Saturday Report: 5 patients in the ICU did not respond to antibiotics.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'context',
				text: `Samples were collected and sent for whole genome sequencing. Your task is to analyze the data.`,
				hint: null,
				requiredDir: null
			},
			{
				type: 'task',
				title: 'Step 1: Quality Control',
				text: `Check the quality of raw sequencing data.`,
				command: 'fastqc sample_01_R1.fastq.gz sample_01_R2.fastq.gz -o qc_reports/',
				explanation: 'FastQC generates quality reports for raw sequence data.',
				requiredDir: '/data/outbreak_investigation',
				parameters: []
			}
		]
	};

	// Use provided storyline or default
	const activeStoryline = $derived(storyline ?? defaultStoryline);

	// Get current phase from the current section
	const currentPhase = $derived(() => {
		for (let i = currentStep; i >= 0; i--) {
			const section = activeStoryline.sections[i];
			if (section.type === 'phase' && section.phase) {
				return section.phase;
			}
		}
		return 1;
	});

	// Subscribe to current directory
	currentDirectory.subscribe(dir => {
		userCurrentDir = dir;
	});

	// Subscribe to executed commands to track step completion
	executedCommands.subscribe(cmds => {
		// Map commands to steps based on task index
		activeStoryline.sections.forEach((section, index) => {
			if (section.type === 'task' && section.command) {
				// Extract tool name from command
				const toolName = section.command.split(' ')[0];
				const altToolName = section.command.split(' ')[0].replace('_', '-');
				if (cmds.includes(toolName) || cmds.includes(altToolName)) {
					completedSteps.add(index);
				}
				// Also check for specific tools
				if (section.command.includes('mob_recon') && cmds.includes('mob_recon')) {
					completedSteps.add(index);
				}
				if (section.command.includes('run_gubbins') && cmds.includes('gubbins')) {
					completedSteps.add(index);
				}
			}
		});
		completedSteps = new Set(completedSteps);
	});

	// Check if user is in the correct directory for a task
	function isInCorrectDir(requiredDir: string | null | undefined): boolean {
		if (!requiredDir) return true;
		return userCurrentDir === requiredDir;
	}

	// Get short directory name for display
	function getShortDir(dir: string): string {
		return dir.replace('/data/outbreak_investigation', '~');
	}

	// Check if user can proceed to next step
	function canProceed(stepIndex: number): boolean {
		const section = activeStoryline.sections[stepIndex];
		// Phase headers and non-task sections don't need completion
		if (section?.type === 'phase' || section?.type === 'intro' || section?.type === 'context' || section?.type === 'complete' || section?.type === 'alert' || section?.type === 'image') {
			return true;
		}
		// Decision sections require a selection to proceed
		if (section?.type === 'decision') {
			return selectedDecision !== null;
		}
		if (stepIndex <= 1) return true;
		// For task steps, check if previous task step is completed
		const prevTaskIndex = stepIndex - 1;
		if (prevTaskIndex <= 1) return true;
		const prevSection = activeStoryline.sections[prevTaskIndex];
		if (prevSection?.type !== 'task') return true;
		return completedSteps.has(prevTaskIndex);
	}

	function nextStep() {
		const nextIdx = currentStep + 1;
		if (nextIdx < activeStoryline.sections.length && canProceed(nextIdx)) {
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

	function handleFinish() {
		isFinished = true;
		goto('/');
	}

	function handleDecision(optionId: string) {
		selectedDecision = optionId;
		// Auto-advance to next step when a decision is made
		nextStep();
	}

	// Check if we're at the complete section
	const isAtComplete = $derived(
		activeStoryline.sections[currentStep]?.type === 'complete'
	);
</script>

<div class="h-full flex flex-col" style="display: flex; flex-direction: column; height: 100%;">
	<!-- Header -->
	<div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6" style="background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; padding: 1.5rem; flex-shrink: 0;">
		<div class="flex items-center gap-3 mb-2" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
			<span class="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
				WGS Analysis
			</span>
			<span class="bg-green-500/80 px-3 py-1 rounded-full text-sm font-medium">
				Phase {currentPhase()}
			</span>
			{#if activeStoryline.organism}
				<span class="bg-purple-500/80 px-3 py-1 rounded-full text-sm font-medium">
					{activeStoryline.organism}
				</span>
			{/if}
		</div>
		<h1 class="text-2xl font-bold">{activeStoryline.title}</h1>
		<p class="text-blue-100 mt-1">{activeStoryline.subtitle}</p>
	</div>

	<!-- Progress Bar -->
	<div class="bg-gray-100 px-6 py-3 border-b border-gray-200" style="background: #f3f4f6; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;">
		<div class="flex items-center justify-between text-sm text-gray-600 mb-2" style="display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; color: #4b5563; margin-bottom: 0.5rem;">
			<span>Progress</span>
			<span>Step {currentStep + 1} of {activeStoryline.sections.length}</span>
		</div>
		<div class="w-full bg-gray-200 rounded-full h-2" style="width: 100%; background: #e5e7eb; border-radius: 9999px; height: 0.5rem;">
			<div
				class="bg-blue-600 h-2 rounded-full transition-all duration-300"
				style="width: {((currentStep + 1) / activeStoryline.sections.length) * 100}%; background: #2563eb; height: 0.5rem; border-radius: 9999px; transition: all 0.3s;"
			></div>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-6" style="flex: 1; overflow: auto; padding: 1.5rem; min-height: 0;">
		{#each activeStoryline.sections as section, i}
			{#if i <= currentStep}
				<div class="mb-6 animate-fade-in" class:opacity-50={i < currentStep && section.type !== 'phase'}>
					{#if section.type === 'intro'}
						<div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
							<p class="text-gray-700 leading-relaxed font-medium whitespace-pre-line">{section.text}</p>
						</div>
					{:else if section.type === 'context'}
						<div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
							<p class="text-gray-700 whitespace-pre-line">{section.text}</p>
						</div>
					{:else if section.type === 'phase'}
						<div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg shadow-md">
							<h2 class="text-lg font-bold">{section.title}</h2>
							<p class="text-indigo-100 text-sm mt-1">{section.text}</p>
						</div>
					{:else if section.type === 'complete'}
						<div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg shadow-lg">
							<div class="text-center mb-4">
								<span class="text-4xl">Completed!</span>
							</div>
							<h2 class="text-xl font-bold text-center">{section.title}</h2>
							<p class="text-green-100 mt-4 whitespace-pre-line">{section.text}</p>
							<div class="mt-6 text-center">
								<button
									onclick={handleFinish}
									class="px-8 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition-colors shadow-md"
								>
									Finished - Return to Home
								</button>
							</div>
						</div>
					{:else if section.type === 'alert'}
						<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
							{#if section.title}
								<h3 class="font-bold text-red-800 mb-2">{section.title}</h3>
							{/if}
							<p class="text-red-700 whitespace-pre-line">{@html section.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')}</p>
						</div>
					{:else if section.type === 'decision'}
						<div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r">
							{#if section.title}
								<h3 class="font-bold text-purple-800 mb-2">{section.title}</h3>
							{/if}
							<p class="text-purple-700 mb-4">{section.text}</p>
							{#if section.options}
								<div class="space-y-3">
									{#each section.options as option}
										<button
											onclick={() => handleDecision(option.id)}
											class="w-full text-left p-4 rounded-lg border-2 transition-all duration-200 {selectedDecision === option.id ? 'border-purple-600 bg-purple-100' : 'border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50'}"
										>
											<div class="font-semibold text-gray-800">{option.label}</div>
											<div class="text-sm text-gray-600 mt-1">{option.description}</div>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{:else if section.type === 'image'}
						<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
							{#if section.title}
								<h3 class="font-semibold text-gray-800 mb-2">{section.title}</h3>
							{/if}
							{#if section.imageUrl}
								<div class="rounded-lg overflow-hidden mb-3 bg-gray-200">
									<img
										src={section.imageUrl}
										alt={section.imageAlt || section.title || 'Storyline image'}
										class="w-full h-auto object-cover"
										onerror={(e) => {
											const target = e.currentTarget as HTMLImageElement;
											target.onerror = null;
											target.src = '/images/placeholder.png';
											target.parentElement?.classList.add('bg-gray-100');
										}}
									/>
								</div>
							{/if}
							<p class="text-gray-600 text-sm italic">{section.text}</p>
						</div>
					{:else if section.type === 'task'}
						<div class="bg-gray-50 rounded-lg p-4 border border-gray-200" class:border-green-400={completedSteps.has(i)} class:bg-green-50={completedSteps.has(i)}>
							<div class="flex items-center justify-between mb-2">
								{#if section.title}
									<h3 class="font-semibold text-gray-800">{section.title}</h3>
								{/if}
								{#if completedSteps.has(i)}
									<span class="text-green-600 text-sm font-medium">Completed</span>
								{/if}
							</div>
							<p class="text-gray-700 mb-3">{section.text}</p>

							{#if section.command}
								<!-- Directory check warning -->
								{#if section.requiredDir && !isInCorrectDir(section.requiredDir) && !completedSteps.has(i)}
									<div class="bg-amber-50 border border-amber-300 rounded p-3 mb-3">
										<div class="flex items-start gap-2">
											<span class="text-amber-500 font-medium">Warning</span>
											<div class="flex-1">
												<p class="text-amber-800 text-sm font-medium">Wrong directory</p>
												<p class="text-amber-700 text-sm">
													You are in <code class="bg-amber-100 px-1 rounded">{getShortDir(userCurrentDir)}</code>
												</p>
												<p class="text-amber-700 text-sm mt-1">Return to the project directory first:</p>
												<div class="bg-gray-900 rounded p-2 mt-1 font-mono text-sm">
													<code class="text-yellow-400">cd ~</code>
												</div>
											</div>
										</div>
									</div>
								{:else if section.requiredDir && isInCorrectDir(section.requiredDir) && !completedSteps.has(i)}
									<div class="flex items-center gap-2 text-green-600 text-sm mb-2">
										<span>OK</span>
										<span>You are in the correct directory (~)</span>
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
										Info: {section.explanation}
									</p>
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		{/each}

		<!-- Next step locked message -->
		{#if currentStep < activeStoryline.sections.length - 1 && !canProceed(currentStep + 1) && !isAtComplete}
			<div class="text-center py-4 text-gray-500 border-t border-dashed">
				<span class="text-lg">Locked</span>
				<p class="text-sm mt-1">Execute the current command to unlock the next step</p>
			</div>
		{/if}
	</div>

	<!-- Navigation -->
	<div class="border-t border-gray-200 bg-gray-50 p-4 flex justify-between items-center" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: #f9fafb; border-top: 1px solid #e5e7eb; flex-shrink: 0;">
		<button
			class="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentStep === 0}
			onclick={prevStep}
		>
			Previous
		</button>
		<div class="flex gap-1 overflow-x-auto max-w-[200px]" style="display: flex; gap: 0.25rem; overflow-x: auto; max-width: 200px;">
			{#each activeStoryline.sections as section, i}
				{#if section.type === 'phase'}
					<div class="w-1 h-3 bg-indigo-400 rounded-full mx-1"></div>
				{:else}
					<button
						class="w-2 h-2 rounded-full transition-colors flex-shrink-0"
						class:bg-blue-600={i <= currentStep && canProceed(i)}
						class:bg-green-500={completedSteps.has(i)}
						class:bg-gray-300={i > currentStep || !canProceed(i)}
						class:cursor-pointer={canProceed(i)}
						class:cursor-not-allowed={!canProceed(i)}
						onclick={() => goToStep(i)}
						aria-label="Go to step {i + 1}"
						disabled={!canProceed(i)}
					></button>
				{/if}
			{/each}
		</div>
		{#if isAtComplete}
			<button
				onclick={handleFinish}
				class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
			>
				Finished
			</button>
		{:else}
			<button
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={currentStep >= activeStoryline.sections.length - 1 || !canProceed(currentStep + 1)}
				onclick={nextStep}
			>
				{#if currentStep < activeStoryline.sections.length - 1 && !canProceed(currentStep + 1)}
					Locked
				{:else}
					Next
				{/if}
			</button>
		{/if}
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
