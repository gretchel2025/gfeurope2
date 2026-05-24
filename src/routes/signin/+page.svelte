<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/infrastructure/auth/authClient';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	let localAdminEmail = '';

	async function signOutCurrentUser() {
		await authClient.signOut();
		await invalidateAll();
		await goto('/signin', { invalidateAll: true });
	}

	async function signInWithGoogle() {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/api'
		});
	}
</script>

<main
	class="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0f172a]/80 to-[#1e293b]/80 text-white"
>
	<article class="w-full max-w-md bg-black/70 rounded-xl shadow-lg p-8 text-center space-y-6">
		<h1 class="text-3xl font-bold text-yellow-400">Log In</h1>

		{#if $page.data.session?.user}
			<div class="space-y-4">
				<p class="text-blue-100">
					Signed in as <span class="font-semibold text-white">{$page.data.session.user.email}</span>
				</p>
				<button
					on:click={signOutCurrentUser}
					class="w-full py-3 px-6 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition"
				>
					Sign Out
				</button>

				<a href="/api" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
					Go to Admin Page
				</a>
			</div>
		{:else}
			<div class="space-y-4">
				<p class="text-blue-100">Not signed in</p>

				{#if data.hasGoogleAuth}
					<button
						on:click={signInWithGoogle}
						class="w-full py-3 px-6 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
					>
						Sign in with Google
					</button>
				{/if}

				{#if data.hasLocalDevAuth}
					<form
						method="POST"
						action="?/localAdminSignIn"
						class="space-y-3 border border-white/10 rounded-lg p-4 bg-white/5"
					>
						<p class="text-sm text-blue-100">Local development admin sign-in</p>
						<input
							bind:value={localAdminEmail}
							name="email"
							type="email"
							placeholder="Enter a seeded admin email"
							class="w-full py-3 px-4 rounded-md bg-white text-black"
						/>
						<button
							type="submit"
							class="w-full py-3 px-6 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
						>
							Sign in as Local Admin
						</button>
					</form>
				{/if}

				{#if !data.hasGoogleAuth && !data.hasLocalDevAuth}
					<p class="text-sm text-red-200">
						No auth provider is configured for this environment. Configure Google OAuth or set
						`LOCAL_ADMIN_EMAILS` for local development.
					</p>
				{/if}
			</div>
		{/if}
	</article>
</main>
