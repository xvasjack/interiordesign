<script lang="ts">
	import ThreePanelLayout from '$lib/components/ThreePanelLayout.svelte';
	import { getStoryline } from '$lib/storylines/wgs-bacteria';

	const storyline = getStoryline('trial');
</script>

<ThreePanelLayout {storyline} />
