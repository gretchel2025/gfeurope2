<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOutCurrentUser as signOutAuth } from '$lib/infrastructure/auth/authClient';
	import { page } from '$app/stores';
	import { adminRoutes, publicRoutes } from '$lib/navigation/adminRoutes';

	async function signOutCurrentUser() {
		await signOutAuth($page.data.supabaseAuth);
		await goto(publicRoutes.signin);
	}
</script>

<nav class="admin-nav border-b border-slate-200/80 px-4 py-3 text-sm text-slate-700">
	<div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
			<a href={adminRoutes.home} class="hover:text-slate-950">Dashboard</a>
			<a href={adminRoutes.booking.list} class="hover:text-slate-950">Bookings</a>
			<a href={adminRoutes.booking.search()} class="hover:text-slate-950">Search</a>
			<a href={adminRoutes.ticket.list} class="hover:text-slate-950">Tickets</a>
			<a href={adminRoutes.reports} class="hover:text-slate-950">Reports</a>
			<a href={adminRoutes.system} class="hover:text-slate-950">System</a>
		</div>

		{#if $page.data.session?.user}
			<div class="flex flex-wrap items-center gap-3 text-slate-600">
				<a href={publicRoutes.signin} class="hover:text-slate-950"
					>{$page.data.session.user.email}</a
				>
				<button
					type="button"
					class="font-semibold text-red-700 hover:text-red-800"
					on:click={signOutCurrentUser}
				>
					Sign out
				</button>
			</div>
		{/if}
	</div>
</nav>

<slot />
