<script lang="ts">
	import { page } from '$app/stores';

	$: hostname = $page.url.hostname.toLowerCase();
	$: showDetails =
		hostname === 'dev.grandfeast.eu' ||
		hostname === 'dev--grand-feast-uk-x-europe.netlify.app' ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1';
	$: diagnosticRows = [
		['Status', String($page.status)],
		['Message', $page.error?.message],
		['Path', $page.error?.path ?? $page.url.pathname],
		['Name', $page.error?.name],
		['Code', $page.error?.code],
		['Timestamp', $page.error?.timestamp],
		['Cause', $page.error?.cause]
	].filter(([, value]) => Boolean(value));
	$: stack = $page.error?.stack;
</script>

{#if showDetails}
	<section class="mt-6 space-y-4 text-left">
		<div class="border border-[#f3c15f]/35 bg-[#021821]/85 p-4">
			<p class="conference-kicker">Diagnostics</p>
			<dl class="mt-3 grid gap-3 text-sm">
				{#each diagnosticRows as [label, value]}
					<div class="grid gap-1">
						<dt class="font-black text-[#f3c15f]">{label}</dt>
						<dd class="break-words font-mono text-[#fff3df]/85">{value}</dd>
					</div>
				{/each}
			</dl>
		</div>

		{#if stack}
			<div class="border border-white/10 bg-black/35 p-4">
				<p class="conference-kicker">Stack</p>
				<pre
					class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-[#fff3df]/80">{stack}</pre>
			</div>
		{/if}
	</section>
{/if}
