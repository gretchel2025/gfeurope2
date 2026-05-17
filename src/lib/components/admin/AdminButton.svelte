<script lang="ts">
	export let href: string | undefined = undefined;
	export let type: 'button' | 'submit' = 'button';
	export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary';
	export let disabled = false;
	export let fullWidth = false;

	const variants = {
		primary: 'bg-blue-700 text-white hover:bg-blue-800',
		secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
		success: 'bg-green-700 text-white hover:bg-green-800',
		warning: 'bg-amber-500 text-slate-950 hover:bg-amber-600',
		danger: 'bg-red-700 text-white hover:bg-red-800'
	};

	$: classes = [
		'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition',
		fullWidth ? 'w-full' : '',
		disabled ? 'cursor-not-allowed opacity-50' : variants[variant]
	]
		.filter(Boolean)
		.join(' ');
</script>

{#if href}
	<a class={classes} href={disabled ? undefined : href} aria-disabled={disabled}>
		<slot />
	</a>
{:else}
	<button class={classes} {type} {disabled}>
		<slot />
	</button>
{/if}
