<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { signOutCurrentUser as signOutAuth } from '$lib/infrastructure/auth/authClient';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;

	let signOutLoading = false;

	async function signOutCurrentUser() {
		signOutLoading = true;
		await signOutAuth($page.data.supabaseAuth);
		await invalidateAll();
		await goto('/signin', { invalidateAll: true });
	}
</script>

<section class="public-status-page">
	<article class="conference-panel w-full max-w-lg p-8 text-center">
		<div class="space-y-3">
			<p class="conference-kicker text-[#d64b55]">Access unavailable</p>
			<h1 class="text-3xl font-black text-white">You are signed in</h1>
			<p class="text-[#fff3df]/75">
				Your account
				<span class="font-semibold text-white">{data.session.user.email}</span>
				does not have permission to access this page.
			</p>
			<p class="text-[#fff3df]/75">Please contact an admin if you need access.</p>
		</div>

		<div class="mt-6 space-y-3">
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
			<a href="/" class="conference-button px-4 py-3 text-sm"> Go Home </a>
		</div>
	</article>
</section>
