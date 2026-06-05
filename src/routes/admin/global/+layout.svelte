<script lang="ts">
	import { adminIndexRoute, globalAdminRoutes } from '$lib/navigation/adminRoutes';
</script>

<section class="admin-page-surface border-b border-slate-200/80 px-4 py-3">
	<div class="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Global admin</p>
			<h2 class="mt-1 text-lg font-black text-slate-950">Global scope</h2>
		</div>
		<div class="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
			<span class="rounded-full border border-slate-300 bg-white px-3 py-1">superuser</span>
			<span class="rounded-full border border-slate-300 bg-white px-3 py-1">all events</span>
		</div>
	</div>
</section>

<nav class="admin-nav border-b border-slate-200/80 px-4 py-3 text-sm text-slate-700">
	<div class="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 font-semibold">
		<a href={adminIndexRoute} class="hover:text-slate-950">Admin</a>
		<a href={globalAdminRoutes.events} class="hover:text-slate-950">Events</a>
		<a href={globalAdminRoutes.users} class="hover:text-slate-950">Users</a>
	</div>
</nav>

<slot />
