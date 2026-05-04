<script lang="ts">
	import { onMount } from 'svelte';

	export let target: Date;

	let now = Date.now();

	onMount(() => {
		const interval = window.setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => window.clearInterval(interval);
	});

	$: remaining = Math.max(target.getTime() - now, 0);
	$: days = Math.floor(remaining / (1000 * 60 * 60 * 24));
	$: hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
	$: minutes = Math.floor((remaining / (1000 * 60)) % 60);
	$: seconds = Math.floor((remaining / 1000) % 60);

	function format(value: number): string {
		return value.toString().padStart(2, '0');
	}
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
	<div class="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
		<div class="text-2xl font-bold sm:text-3xl md:text-4xl">{format(days)}</div>
		<div class="text-sm text-blue-200">Days</div>
	</div>
	<div class="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
		<div class="text-2xl font-bold sm:text-3xl md:text-4xl">{format(hours)}</div>
		<div class="text-sm text-blue-200">Hours</div>
	</div>
	<div class="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
		<div class="text-2xl font-bold sm:text-3xl md:text-4xl">{format(minutes)}</div>
		<div class="text-sm text-blue-200">Minutes</div>
	</div>
	<div class="rounded-lg bg-white/10 p-4 text-center backdrop-blur-sm">
		<div class="text-2xl font-bold sm:text-3xl md:text-4xl">{format(seconds)}</div>
		<div class="text-sm text-blue-200">Seconds</div>
	</div>
</div>
