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
	let localUsername = data.allowLocalPasswordAuth ? 'admin' : '';
	let localPassword = data.allowLocalPasswordAuth ? 'password' : '';
	let localSignInLoading = false;

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

	async function signInWithLocalPassword() {
		if (!data.allowLocalPasswordAuth) {
			return;
		}

		signInError = '';
		localSignInLoading = true;
		const supabase = createAuthClient($page.data.supabaseAuth);
		const { error } = await supabase.auth.signInWithPassword({
			email: normalizeLocalLogin(localUsername),
			password: localPassword
		});
		localSignInLoading = false;

		if (error) {
			signInError = 'Unable to sign in with local credentials.';
			return;
		}

		await invalidateAll();
		await goto(data.callbackURL, { invalidateAll: true });
	}

	function normalizeLocalLogin(value: string) {
		const trimmed = value.trim().toLowerCase();
		return trimmed === 'admin' ? 'admin@example.test' : trimmed;
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

				{#if data.allowLocalPasswordAuth}
					<form class="space-y-3 text-left" on:submit|preventDefault={signInWithLocalPassword}>
						<p class="rounded-md bg-yellow-400/15 px-3 py-2 text-sm font-semibold text-yellow-100">
							Local dev: use admin / password.
						</p>

						<div class="space-y-1">
							<label for="local-username" class="block text-sm font-semibold text-blue-100">
								Local dev username
							</label>
							<input
								id="local-username"
								type="text"
								bind:value={localUsername}
								autocomplete="username"
								required
								class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-blue-100/60 focus:border-yellow-400 focus:outline-none"
							/>
						</div>

						<div class="space-y-1">
							<label for="local-password" class="block text-sm font-semibold text-blue-100">
								Local dev password
							</label>
							<input
								id="local-password"
								type="password"
								bind:value={localPassword}
								autocomplete="current-password"
								required
								class="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-blue-100/60 focus:border-yellow-400 focus:outline-none"
							/>
						</div>

						<button
							type="submit"
							disabled={localSignInLoading}
							class="w-full py-3 px-6 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-60"
						>
							{localSignInLoading ? 'Signing in...' : 'Sign in locally'}
						</button>
					</form>
				{/if}

				{#if !data.hasGoogleAuth && !data.allowLocalPasswordAuth}
					<p class="text-sm text-red-200">
						No auth provider is configured for this environment. Configure Supabase Auth environment
						variables.
					</p>
				{/if}
			</div>
		{/if}
	</article>
</main>
