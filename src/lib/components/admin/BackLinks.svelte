<script lang="ts">
	type BackLink = {
		href: string;
		label: string;
	};

	export let links: BackLink[] = [{ href: '/api', label: 'Admin home' }];
</script>

<nav
	class="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-blue-700"
	aria-label="Secondary navigation"
>
	{#each links as link}
		<a href={link.href} class="hover:underline">{link.label}</a>
	{/each}
</nav>
