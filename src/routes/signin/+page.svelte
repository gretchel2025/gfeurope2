<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		createAuthClient,
		signOutCurrentUser as signOutAuth
	} from '$lib/infrastructure/auth/authClient';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	let signInError = '';

	async function signOutCurrentUser() {
		await signOutAuth($page.data.supabaseAuth);
		await invalidateAll();
		await goto('/signin', { invalidateAll: true });
	}

	async function signInWithGoogle() {
		signInError = '';
		const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
			data.callbackURL
		)}`;
		const supabase = createAuthClient($page.data.supabaseAuth);
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo
			}
		});

		if (error) {
			signInError = 'Unable to start Google sign-in. Please try again.';
		}
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

				<a
					href={data.callbackURL}
					class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
				>
					Continue
				</a>
			</div>
		{:else}
			<div class="space-y-4">
				<p class="text-blue-100">Not signed in</p>

				{#if data.authError || signInError}
					<p class="text-sm text-red-200">
						{signInError || 'Sign-in could not be completed. Please try again.'}
					</p>
				{/if}

				{#if data.hasGoogleAuth}
					<button
						on:click={signInWithGoogle}
						class="w-full py-3 px-6 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition"
					>
						Sign in with Google
					</button>
				{/if}

				{#if !data.hasGoogleAuth}
					<p class="text-sm text-red-200">
						No auth provider is configured for this environment. Configure Supabase Auth environment
						variables.
					</p>
				{/if}
			</div>
		{/if}
	</article>
</main>
