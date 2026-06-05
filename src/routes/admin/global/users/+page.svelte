<script lang="ts">
	import AdminCard from '$lib/ui/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/ui/components/admin/AdminPage.svelte';
	import { adminIndexRoute } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	function formatDate(value: string | null) {
		if (!value) {
			return 'Never';
		}

		return new Intl.DateTimeFormat('en', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function formatRoles(roles: string[]) {
		return roles.length > 0 ? roles.join(', ') : 'None';
	}

	function formatEventGrants(eventRoles: ServerData['users'][number]['event_roles']) {
		const grants = Object.entries(eventRoles)
			.sort(([eventA], [eventB]) => eventA.localeCompare(eventB))
			.map(([eventId, roles]) => `${eventId}: ${roles.join(', ')}`);

		return grants.length > 0 ? grants.join('; ') : 'None';
	}
</script>

<AdminPage
	title="Admin Users"
	subtitle="Read-only view of Supabase Auth users with tester or admin access."
	backHref={adminIndexRoute}
	backLabel="Admin"
	showBackLink={true}
>
	<AdminCard title="Users" subtitle="Filtered to tester, admin, superuser, and event-admin users.">
		{#if data.users.length > 0}
			<div class="grid gap-3">
				{#each data.users as user}
					<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
						<header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
							<div class="min-w-0">
								<h2 class="break-words text-base font-semibold text-slate-950">
									{user.email || 'No email'}
								</h2>
								<p class="mt-1 break-all font-mono text-xs text-slate-500">{user._id}</p>
							</div>
							<p class="text-sm font-semibold text-slate-700">
								{user.confirmed_at ? 'Confirmed' : 'Unconfirmed'}
							</p>
						</header>

						<dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<dt class="font-semibold text-slate-500">Global roles</dt>
								<dd class="mt-1 break-words text-slate-950">{formatRoles(user.roles)}</dd>
							</div>
							<div>
								<dt class="font-semibold text-slate-500">Event grants</dt>
								<dd class="mt-1 break-words text-slate-950">
									{formatEventGrants(user.event_roles)}
								</dd>
							</div>
							<div>
								<dt class="font-semibold text-slate-500">Created</dt>
								<dd class="mt-1 text-slate-950">{formatDate(user.created_at)}</dd>
							</div>
							<div>
								<dt class="font-semibold text-slate-500">Last sign-in</dt>
								<dd class="mt-1 text-slate-950">{formatDate(user.last_sign_in_at)}</dd>
							</div>
						</dl>
					</article>
				{/each}
			</div>
		{:else}
			<p class="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
				No admin or tester users found.
			</p>
		{/if}
	</AdminCard>
</AdminPage>
