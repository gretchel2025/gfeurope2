<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';
	import AuroraBackground from '$lib/components/public/AuroraBackground.svelte';

	let isMenuOpen = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<AuroraBackground />

<header class="relative z-10 px-4 py-6 md:px-8">
	<div class="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex items-center justify-between">
			<a href="/" on:click={closeMenu}>
				<h1 class="text-2xl font-bold tracking-wider text-white">Grand Feast EU UK</h1>
			</a>

			<button
				type="button"
				class="rounded-md border border-white/30 px-3 py-2 text-sm font-semibold text-white md:hidden"
				aria-expanded={isMenuOpen}
				aria-controls="site-nav"
				on:click={toggleMenu}
			>
				Menu
			</button>
		</div>

		<nav id="site-nav" class:hidden={!isMenuOpen} class="md:block">
			<ul class="flex flex-col gap-3 md:flex-row md:gap-6">
				<li>
					<a href="/" class="text-blue-200 transition hover:text-white" on:click={closeMenu}>Home</a
					>
				</li>
				<li>
					<a
						href="/#speakers"
						class="text-blue-200 transition hover:text-white"
						on:click={closeMenu}>Speakers</a
					>
				</li>
				<li>
					<a href="/#details" class="text-blue-200 transition hover:text-white" on:click={closeMenu}
						>Details</a
					>
				</li>
				<li>
					<a
						href="/newbooking"
						class="text-blue-200 transition hover:text-white"
						on:click={closeMenu}>Buy Tickets</a
					>
				</li>
			</ul>
		</nav>
	</div>
</header>

<slot />

{#if !$page.url.pathname.startsWith('/api')}
	<footer
		class="relative z-10 border-t border-blue-500/10 bg-gradient-to-b from-[#0c0f1d] to-[#080d17] px-4 py-12"
	>
		<div class="mx-auto max-w-4xl text-center">
			<p class="mb-6 text-blue-300">© 2025 Grand Feast Europe and UK. All rights reserved.</p>
			<div class="flex flex-wrap justify-center gap-x-6 gap-y-3">
				<a href="/conditions" class="text-blue-200 transition hover:underline hover:text-white">
					&gt; Terms &amp; Conditions
				</a>
				<a href="/privacy" class="text-blue-200 transition hover:underline hover:text-white">
					&gt; Privacy Policy
				</a>
				<a href="/faq" class="text-blue-200 transition hover:underline hover:text-white">
					&gt; FAQ
				</a>
				<a
					href="/api"
					target="_self"
					rel="noopener"
					class="text-blue-200 transition hover:underline hover:text-white"
				>
					&gt; Organizers
				</a>
			</div>
		</div>
	</footer>
{/if}
