<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/infrastructure/auth/authClient';
	import { page } from '$app/stores';
	import { adminRoutes, publicRoutes } from '$lib/navigation/adminRoutes';

	async function signOutCurrentUser() {
		await authClient.signOut();
		await goto(publicRoutes.signin);
	}
</script>

<nav
	class="relative z-10 border-y border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-slate-100"
>
	<div class="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
			<a href={adminRoutes.home} class="hover:text-white">Dashboard</a>
			<a href={adminRoutes.booking.list} class="hover:text-white">Bookings</a>
			<a href={adminRoutes.booking.search()} class="hover:text-white">Search</a>
			<a href={adminRoutes.ticket.list} class="hover:text-white">Tickets</a>
			<a href={adminRoutes.reports} class="hover:text-white">Reports</a>
			<a href={adminRoutes.system} class="hover:text-white">System</a>
		</div>

		{#if $page.data.session?.user}
			<div class="flex flex-wrap items-center gap-3 text-slate-300">
				<a href={publicRoutes.signin} class="hover:text-white">{$page.data.session.user.email}</a>
				<button
					type="button"
					class="font-semibold text-red-200 hover:text-red-100"
					on:click={signOutCurrentUser}
				>
					Sign out
				</button>
			</div>
		{/if}
	</div>
</nav>

<slot />
