<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		createAuthClient,
		signOutCurrentUser as signOutAuth
	} from '$lib/infrastructure/auth/authClient';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: hasPasswordAuth = data.passwordAuthMode !== 'none';
	$: isLocalPasswordAuth = data.passwordAuthMode === 'local';
	let signInError = '';
	let passwordAuthEmail = data.passwordAuthMode === 'local' ? 'admin' : '';
	let passwordAuthPassword = data.passwordAuthMode === 'local' ? 'password' : '';
	let passwordSignInLoading = false;
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

	async function signInWithPassword() {
		if (!hasPasswordAuth) {
			return;
		}

		signInError = '';
		passwordSignInLoading = true;
		const supabase = createAuthClient($page.data.supabaseAuth);
		const { error } = await supabase.auth.signInWithPassword({
			email: normalizePasswordAuthLogin(passwordAuthEmail),
			password: passwordAuthPassword
		});
		passwordSignInLoading = false;

		if (error) {
			signInError = 'Unable to sign in with these credentials.';
			return;
		}

		await invalidateAll();
		await goto(data.callbackURL, { invalidateAll: true });
	}

	function normalizePasswordAuthLogin(value: string) {
		const trimmed = value.trim().toLowerCase();
		return isLocalPasswordAuth && trimmed === 'admin' ? 'admin@example.test' : trimmed;
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

				{#if hasPasswordAuth}
					<form
						class="public-form-card space-y-3 text-left"
						on:submit|preventDefault={signInWithPassword}
					>
						{#if isLocalPasswordAuth}
							<p class="bg-[#d99a32]/20 px-3 py-2 text-sm font-bold text-[#f3c15f]">
								Local dev: use admin / password.
							</p>
						{/if}

						<div class="space-y-1">
							<label for="password-auth-email" class="block text-sm font-bold text-white">
								{isLocalPasswordAuth ? 'Local dev username' : 'Email'}
							</label>
							<input
								id="password-auth-email"
								type="text"
								bind:value={passwordAuthEmail}
								autocomplete="username"
								required
								class="w-full px-3 py-2"
							/>
						</div>

						<div class="space-y-1">
							<label for="password-auth-password" class="block text-sm font-bold text-white">
								Password
							</label>
							<input
								id="password-auth-password"
								type="password"
								bind:value={passwordAuthPassword}
								autocomplete="current-password"
								required
								class="w-full px-3 py-2"
							/>
						</div>

						<button
							type="submit"
							disabled={passwordSignInLoading}
							aria-busy={passwordSignInLoading}
							class={`conference-button w-full px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 ${
								passwordSignInLoading ? 'is-loading' : ''
							}`}
						>
							<span class="button-spinner" aria-hidden="true"></span>
							<span>{passwordSignInLoading ? 'Signing in...' : 'Sign in with password'}</span>
						</button>
					</form>
				{/if}

				{#if !data.hasGoogleAuth && !hasPasswordAuth}
					<p class="text-sm text-red-200">
						No auth provider is configured for this environment. Configure Supabase Auth environment
						variables.
					</p>
				{/if}
			</div>
		{/if}
	</article>
</section>
