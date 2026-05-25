<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/infrastructure/auth/authClient';
	import type { PageData } from './$types';

	export let data: PageData;

	async function signOutCurrentUser() {
		await authClient.signOut();
		await invalidateAll();
		await goto('/signin', { invalidateAll: true });
	}
</script>

<main
	class="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 text-white"
>
	<article class="w-full max-w-lg bg-black/70 rounded-xl shadow-lg p-8 text-center space-y-6">
		<div class="space-y-3">
			<p class="text-sm font-semibold uppercase tracking-wide text-red-200">Access unavailable</p>
			<h1 class="text-3xl font-bold text-yellow-400">You are signed in</h1>
			<p class="text-blue-100">
				Your account
				<span class="font-semibold text-white">{data.session.user.email}</span>
				does not have permission to access this page.
			</p>
			<p class="text-blue-100">Please contact an admin if you need access.</p>
		</div>

		<div class="space-y-3">
			<button
				on:click={signOutCurrentUser}
				class="w-full py-3 px-6 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition"
			>
				Sign Out
			</button>
			<a
				href="/"
				class="inline-flex justify-center px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
			>
				Go Home
			</a>
		</div>
	</article>
</main>
