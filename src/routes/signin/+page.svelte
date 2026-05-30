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
	let googleSignInLoading = false;
	let signOutLoading = false;

	async function signOutCurrentUser() {
		signOutLoading = true;
		await signOutAuth($page.data.supabaseAuth);
		await invalidateAll();
		await goto('/signin', { invalidateAll: true });
	}

	async function signInWithGoogle() {
		signInError = '';
		googleSignInLoading = true;
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
			googleSignInLoading = false;
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

<section class="public-status-page">
	<article class="conference-panel w-full max-w-md p-8 text-center">
		<p class="conference-kicker">Organizer Access</p>
		<h1 class="mt-3 text-3xl font-black text-white">Log In</h1>

		{#if $page.data.session?.user}
			<div class="mt-6 space-y-4">
				<p class="text-[#fff3df]/75">
					Signed in as <span class="font-semibold text-white">{$page.data.session.user.email}</span>
				</p>
				<button
					on:click={signOutCurrentUser}
					disabled={signOutLoading}
					aria-busy={signOutLoading}
					class={`inline-flex w-full items-center justify-center gap-2 bg-[#d64b55] px-6 py-3 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
						signOutLoading ? 'is-loading' : ''
					}`}
				>
					<span class="button-spinner" aria-hidden="true"></span>
					<span>{signOutLoading ? 'Signing out...' : 'Sign Out'}</span>
				</button>

				<a href={data.callbackURL} class="conference-button px-4 py-3 text-sm"> Continue </a>
			</div>
		{:else}
			<div class="mt-6 space-y-4">
				<p class="text-[#fff3df]/75">Not signed in</p>

				{#if data.authError || signInError}
					<p class="text-sm text-red-200">
						{signInError || 'Sign-in could not be completed. Please try again.'}
					</p>
				{/if}

				{#if data.hasGoogleAuth}
					<button
						on:click={signInWithGoogle}
						disabled={googleSignInLoading}
						aria-busy={googleSignInLoading}
						class={`conference-button w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
							googleSignInLoading ? 'is-loading' : ''
						}`}
					>
						<span class="button-spinner" aria-hidden="true"></span>
						<span>{googleSignInLoading ? 'Opening Google...' : 'Sign in with Google'}</span>
					</button>
				{/if}

				{#if data.allowLocalPasswordAuth}
					<form
						class="public-form-card space-y-3 text-left"
						on:submit|preventDefault={signInWithLocalPassword}
					>
						<p class="bg-[#d99a32]/20 px-3 py-2 text-sm font-bold text-[#f3c15f]">
							Local dev: use admin / password.
						</p>

						<div class="space-y-1">
							<label for="local-username" class="block text-sm font-bold text-white">
								Local dev username
							</label>
							<input
								id="local-username"
								type="text"
								bind:value={localUsername}
								autocomplete="username"
								required
								class="w-full px-3 py-2"
							/>
						</div>

						<div class="space-y-1">
							<label for="local-password" class="block text-sm font-bold text-white">
								Local dev password
							</label>
							<input
								id="local-password"
								type="password"
								bind:value={localPassword}
								autocomplete="current-password"
								required
								class="w-full px-3 py-2"
							/>
						</div>

						<button
							type="submit"
							disabled={localSignInLoading}
							aria-busy={localSignInLoading}
							class={`conference-button w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
								localSignInLoading ? 'is-loading' : ''
							}`}
						>
							<span class="button-spinner" aria-hidden="true"></span>
							<span>{localSignInLoading ? 'Signing in...' : 'Sign in locally'}</span>
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
</section>
