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

<main class="admin-page-surface flex min-h-screen items-start px-4 py-8 text-slate-900">
	<section class="mx-auto flex w-full max-w-xl flex-col gap-6">
		<header>
			<p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Organizer Access</p>
			<h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in</h1>
			<p class="mt-1 text-sm text-slate-600">
				Use your Grand Feast account to access organizer tools.
			</p>
		</header>

		<article class="admin-card w-full rounded-lg bg-white p-6 shadow-sm sm:p-8">
			{#if $page.data.session?.user}
				<div class="mt-6 space-y-4">
					<p class="text-sm text-slate-600">
						Signed in as
						<span class="font-semibold text-slate-950">{$page.data.session.user.email}</span>
					</p>
					<button
						on:click={signOutCurrentUser}
						disabled={signOutLoading}
						aria-busy={signOutLoading}
						class={`inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60 ${
							signOutLoading ? 'is-loading' : ''
						}`}
					>
						<span class="button-spinner" aria-hidden="true"></span>
						<span>{signOutLoading ? 'Signing out...' : 'Sign out'}</span>
					</button>

					<a
						href="/admin"
						class="inline-flex w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
					>
						Continue
					</a>
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-sm text-slate-600">Not signed in</p>

					{#if data.authError || signInError}
						<p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							{signInError || 'Sign-in could not be completed. Please try again.'}
						</p>
					{/if}

					{#if data.hasGoogleAuth}
						<button
							on:click={signInWithGoogle}
							disabled={googleSignInLoading}
							aria-busy={googleSignInLoading}
							class={`admin-button-primary inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
								googleSignInLoading ? 'is-loading' : ''
							}`}
						>
							<span class="button-spinner" aria-hidden="true"></span>
							<span>{googleSignInLoading ? 'Opening Google...' : 'Sign in with Google'}</span>
						</button>
					{/if}

					{#if hasPasswordAuth}
						<form
							class="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-left"
							on:submit|preventDefault={signInWithPassword}
						>
							{#if isLocalPasswordAuth}
								<p
									class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800"
								>
									Local dev: use admin / password.
								</p>
							{/if}

							<div class="space-y-1">
								<label for="password-auth-email" class="block text-sm font-semibold text-slate-700">
									{isLocalPasswordAuth ? 'Local dev username' : 'Email'}
								</label>
								<input
									id="password-auth-email"
									type="text"
									bind:value={passwordAuthEmail}
									autocomplete="username"
									required
									class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
								/>
							</div>

							<div class="space-y-1">
								<label
									for="password-auth-password"
									class="block text-sm font-semibold text-slate-700"
								>
									Password
								</label>
								<input
									id="password-auth-password"
									type="password"
									bind:value={passwordAuthPassword}
									autocomplete="current-password"
									required
									class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
								/>
							</div>

							<button
								type="submit"
								disabled={passwordSignInLoading}
								aria-busy={passwordSignInLoading}
								class={`admin-button-primary inline-flex w-full items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
									passwordSignInLoading ? 'is-loading' : ''
								}`}
							>
								<span class="button-spinner" aria-hidden="true"></span>
								<span>{passwordSignInLoading ? 'Signing in...' : 'Sign in with password'}</span>
							</button>
						</form>
					{/if}

					{#if !data.hasGoogleAuth && !hasPasswordAuth}
						<p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
							No auth provider is configured for this environment. Configure Supabase Auth
							environment variables.
						</p>
					{/if}
				</div>
			{/if}
		</article>
	</section>
</main>
