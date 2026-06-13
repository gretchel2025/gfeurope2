<script lang="ts">
	import Gfeu2025ArchiveLanding from '$lib/ui/components/public/events/Gfeu2025ArchiveLanding.svelte';
	import Gfeu2026Landing from '$lib/ui/components/public/events/Gfeu2026Landing.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
</script>

{#if data.publicEventPage.component === 'gfeu2026'}
	<Gfeu2026Landing ticketTypes={data.ticketTypes} merchProducts={data.merchProducts} />
{:else if data.publicEventPage.component === 'gfeu2025'}
	<Gfeu2025ArchiveLanding ticketTypes={data.ticketTypes} />
{/if}
