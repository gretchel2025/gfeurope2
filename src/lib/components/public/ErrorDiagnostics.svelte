<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	type ClientErrorDiagnostic = {
		type?: string;
		name?: string;
		message?: string;
		path?: string;
		timestamp?: string;
		filename?: string;
		lineno?: number;
		colno?: number;
		resource?: string;
		stack?: string;
		userAgent?: string;
	};

	const storageKey = 'grandfeast:last-client-error';

	let clientError: ClientErrorDiagnostic | null = null;

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
	$: clientDiagnosticRows = clientError
		? [
				['Type', clientError.type],
				['Message', clientError.message],
				['Path', clientError.path],
				['Name', clientError.name],
				['File', formatClientLocation(clientError)],
				['Resource', clientError.resource],
				['Timestamp', clientError.timestamp],
				['User Agent', clientError.userAgent]
			].filter(([, value]) => Boolean(value))
		: [];

	onMount(() => {
		clientError = readClientError();
	});

	function readClientError(): ClientErrorDiagnostic | null {
		const windowWithDiagnostic = window as Window & {
			__grandfeastLastClientError?: ClientErrorDiagnostic;
		};
		if (windowWithDiagnostic.__grandfeastLastClientError) {
			return windowWithDiagnostic.__grandfeastLastClientError;
		}

		try {
			const raw = sessionStorage.getItem(storageKey);
			return raw ? (JSON.parse(raw) as ClientErrorDiagnostic) : null;
		} catch {
			return null;
		}
	}

	function formatClientLocation(error: ClientErrorDiagnostic) {
		if (!error.filename) return undefined;
		if (!error.lineno) return error.filename;
		return `${error.filename}:${error.lineno}:${error.colno ?? 0}`;
	}
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

		{#if clientDiagnosticRows.length > 0}
			<div class="border border-[#f3c15f]/35 bg-[#021821]/85 p-4">
				<p class="conference-kicker">Client Error</p>
				<dl class="mt-3 grid gap-3 text-sm">
					{#each clientDiagnosticRows as [label, value]}
						<div class="grid gap-1">
							<dt class="font-black text-[#f3c15f]">{label}</dt>
							<dd class="break-words font-mono text-[#fff3df]/85">{value}</dd>
						</div>
					{/each}
				</dl>
			</div>

			{#if clientError?.stack}
				<div class="border border-white/10 bg-black/35 p-4">
					<p class="conference-kicker">Client Stack</p>
					<pre
						class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-[#fff3df]/80">{clientError.stack}</pre>
				</div>
			{/if}
		{/if}
	</section>
{/if}
