<script lang="ts">
	import Terminal from './Terminal.svelte';
	import StoryPanel from './StoryPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';

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
</script>

<div class="h-screen w-screen flex overflow-hidden">
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

<style>
	:global(body) {
		overflow: hidden;
	}
</style>
