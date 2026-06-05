<script lang="ts">
	import { page } from '$app/stores';
	import { adminRoutes } from '$lib/navigation/adminRoutes';

	type BackLink = {
		href: string;
		label: string;
	};

	export let links: BackLink[] | undefined = undefined;

	$: resolvedLinks = links ?? [
		{ href: adminRoutes($page.params.event_id).home, label: 'Dashboard' }
	];
</script>

<nav
	class="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-blue-700"
	aria-label="Secondary navigation"
>
	{#each resolvedLinks as link}
		<a href={link.href} class="hover:underline">{link.label}</a>
	{/each}
</nav>
