<script lang="ts">
	import { page } from '$app/stores';
	import '../app.css';

	let isMenuOpen = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	$: isAdminRoute = $page.url.pathname.startsWith('/api');
</script>

{#if isAdminRoute}
	<div class="admin-shell text-slate-950">
		<header class="admin-header border-b border-slate-200/80 px-4 py-6 md:px-8">
			<div
				class="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between"
			>
				<div class="flex items-center justify-between">
					<a href="/" on:click={closeMenu}>
						<h1 class="text-2xl font-bold tracking-wider text-slate-950">Grand Feast EU UK</h1>
					</a>

					<button
						type="button"
						class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 md:hidden"
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
							<a
								href="/"
								class="text-slate-600 transition hover:text-slate-950"
								on:click={closeMenu}>Home</a
							>
						</li>
						<li>
							<a
								href="/#speakers"
								class="text-slate-600 transition hover:text-slate-950"
								on:click={closeMenu}>Speakers</a
							>
						</li>
						<li>
							<a
								href="/#details"
								class="text-slate-600 transition hover:text-slate-950"
								on:click={closeMenu}>Details</a
							>
						</li>
						<li>
							<a
								href="/newbooking"
								class="text-slate-600 transition hover:text-slate-950"
								on:click={closeMenu}>Buy Tickets</a
							>
						</li>
					</ul>
				</nav>
			</div>
		</header>

		<slot />
	</div>
{:else}
	<div class="public-site-shell">
		<header class="public-content px-4 py-5 md:px-8">
			<div
				class="mx-auto flex max-w-6xl flex-col gap-4 rounded-xl border border-white/10 bg-[#021821]/80 px-4 py-4 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between md:px-5"
			>
				<div class="flex items-center justify-between">
					<a href="/" on:click={closeMenu} class="group">
						<p class="conference-kicker">Grand Feast</p>
						<h1 class="text-2xl font-black tracking-normal text-white">Europe and UK 2026</h1>
					</a>

					<button
						type="button"
						class="conference-button-secondary px-3 py-2 text-sm md:hidden"
						aria-expanded={isMenuOpen}
						aria-controls="site-nav"
						on:click={toggleMenu}
					>
						Menu
					</button>
				</div>

				<nav id="site-nav" class:hidden={!isMenuOpen} class="md:block">
					<ul class="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
						<li>
							<a
								href="/"
								class="font-semibold text-[#fff3df]/80 transition hover:text-white"
								on:click={closeMenu}>Home</a
							>
						</li>
						<li>
							<a
								href="/#speakers"
								class="font-semibold text-[#fff3df]/80 transition hover:text-white"
								on:click={closeMenu}>Speakers</a
							>
						</li>
						<li>
							<a
								href="/#details"
								class="font-semibold text-[#fff3df]/80 transition hover:text-white"
								on:click={closeMenu}>Details</a
							>
						</li>
						<li>
							<a href="/newbooking" class="conference-button px-4 py-2 text-sm" on:click={closeMenu}
								>Buy Tickets</a
							>
						</li>
					</ul>
				</nav>
			</div>
		</header>

		<main class="public-content">
			<slot />
		</main>

		<footer class="public-content border-t border-white/10 bg-[#021821]/86 px-4 py-12">
			<div class="mx-auto max-w-5xl">
				<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
					<div>
						<p class="conference-kicker">Together in Dublin</p>
						<p class="mt-2 text-lg font-black text-white">Grand Feast EU and UK 2026</p>
						<p class="mt-1 text-sm text-[#fff3df]/70">© 2026 Grand Feast Europe and UK.</p>
					</div>
					<div class="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
						<a href="/conditions" class="text-[#fff3df]/75 transition hover:text-white">
							Terms &amp; Conditions
						</a>
						<a href="/privacy" class="text-[#fff3df]/75 transition hover:text-white">
							Privacy Policy
						</a>
						<a href="/faq" class="text-[#fff3df]/75 transition hover:text-white">FAQ</a>
						<a
							href="/api"
							target="_self"
							rel="noopener"
							class="text-[#fff3df]/75 transition hover:text-white"
						>
							Organizers
						</a>
					</div>
				</div>
			</div>
		</footer>
	</div>
{/if}
