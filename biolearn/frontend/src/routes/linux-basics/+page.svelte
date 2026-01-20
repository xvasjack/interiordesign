<script lang="ts">
	import ThreePanelLayout from '$lib/components/ThreePanelLayout.svelte';
	import { getStoryline } from '$lib/storylines/basic-linux';

	const storyline = getStoryline('linux-basics');
</script>

<ThreePanelLayout {storyline} />
