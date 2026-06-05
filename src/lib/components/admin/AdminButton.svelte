<script lang="ts">
	export let href: string | undefined = undefined;
	export let type: 'button' | 'submit' = 'button';
	export let variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' = 'primary';
	export let disabled = false;
	export let fullWidth = false;
	export let loading = false;
	export let loadingText = 'Working...';

	let clickedLoading = false;

	const variants = {
		primary: 'admin-button-primary text-white',
		secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
		success: 'bg-green-700 text-white hover:bg-green-800',
		warning: 'bg-amber-500 text-slate-950 hover:bg-amber-600',
		danger: 'bg-red-700 text-white hover:bg-red-800'
	};

	$: isLoading = loading || clickedLoading;
	$: isDisabled = disabled || isLoading;
	$: classes = [
		'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition',
		fullWidth ? 'w-full' : '',
		isDisabled ? 'cursor-not-allowed opacity-50' : variants[variant],
		isLoading ? 'is-loading' : ''
	]
		.filter(Boolean)
		.join(' ');

	function handleClick() {
		if (type === 'submit' && !isDisabled) {
			window.setTimeout(() => {
				clickedLoading = true;
			}, 0);
		}
	}
</script>

{#if href}
	<a class={classes} href={isDisabled ? undefined : href} aria-disabled={isDisabled}>
		{#if isLoading}
			<span class="button-spinner" aria-hidden="true"></span>
			<span>{loadingText}</span>
		{:else}
			<slot />
		{/if}
	</a>
{:else}
	<button class={classes} {type} disabled={isDisabled} aria-busy={isLoading} on:click={handleClick}>
		{#if isLoading}
			<span class="button-spinner" aria-hidden="true"></span>
			<span>{loadingText}</span>
		{:else}
			<slot />
		{/if}
	</button>
{/if}
