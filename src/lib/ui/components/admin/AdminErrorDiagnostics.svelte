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
		['URL', $page.error?.url],
		['Route', $page.error?.routeId],
		['Name', $page.error?.name],
		['Code', $page.error?.code],
		['Timestamp', $page.error?.timestamp],
		['Cause', $page.error?.cause],
		['User Agent', $page.error?.userAgent]
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
	<div class="mt-5 space-y-4 text-left">
		<section class="rounded-md border border-slate-200 bg-slate-50 p-4">
			<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Diagnostics</p>
			<dl class="mt-3 grid gap-3 text-sm">
				{#each diagnosticRows as [label, value]}
					<div class="grid gap-1">
						<dt class="font-semibold text-slate-500">{label}</dt>
						<dd class="break-words font-mono text-slate-800">{value}</dd>
					</div>
				{/each}
			</dl>
		</section>

		{#if stack}
			<section class="rounded-md border border-slate-200 bg-slate-50 p-4">
				<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Stack</p>
				<pre
					class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">{stack}</pre>
			</section>
		{/if}

		{#if clientDiagnosticRows.length > 0}
			<section class="rounded-md border border-slate-200 bg-slate-50 p-4">
				<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Client Error</p>
				<dl class="mt-3 grid gap-3 text-sm">
					{#each clientDiagnosticRows as [label, value]}
						<div class="grid gap-1">
							<dt class="font-semibold text-slate-500">{label}</dt>
							<dd class="break-words font-mono text-slate-800">{value}</dd>
						</div>
					{/each}
				</dl>
			</section>

			{#if clientError?.stack}
				<section class="rounded-md border border-slate-200 bg-slate-50 p-4">
					<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Client Stack</p>
					<pre
						class="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">{clientError.stack}</pre>
				</section>
			{/if}
		{/if}
	</div>
{/if}
