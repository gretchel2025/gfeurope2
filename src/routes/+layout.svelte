<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { signOutCurrentUser as signOutAuth } from '$lib/infrastructure/auth/authClient';
	import { adminIndexRoute, adminRoutes, publicRoutes } from '$lib/navigation/adminRoutes';
	import { getPublicEventPage } from '$lib/publicEvents';
	import '../app.css';

	type AdminThemeEvent = {
		theme_main_color?: string;
		theme_sub_color?: string;
		theme_highlight_color?: string;
		theme_on_main_color?: string;
	};

	const neutralAdminTheme = {
		theme_main_color: '#334155',
		theme_sub_color: '#EEF2F7',
		theme_highlight_color: '#64748B',
		theme_on_main_color: '#FFFFFF'
	};

	let isMenuOpen = false;

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	function asHexColor(value: unknown, fallback: string) {
		return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
	}

	function getAdminThemeStyle(event?: AdminThemeEvent) {
		return [
			`--admin-event-main: ${asHexColor(event?.theme_main_color, '#005B72')}`,
			`--admin-event-sub: ${asHexColor(event?.theme_sub_color, '#E7F6F9')}`,
			`--admin-event-highlight: ${asHexColor(event?.theme_highlight_color, '#D99A32')}`,
			`--admin-event-on-main: ${asHexColor(event?.theme_on_main_color, '#FFFFFF')}`
		].join('; ');
	}

	async function signOutCurrentUser() {
		await signOutAuth($page.data.supabaseAuth);
		await goto('/signin');
	}

	$: activeEventId = $page.params.event_id ?? $page.data.defaultEventId;
	$: activePublicEventPage = getPublicEventPage($page.params.event_id);
	$: publicNav = publicRoutes(activeEventId);
	$: isAdminRoute = $page.url.pathname.startsWith('/admin');
	$: isNeutralSiteRoute = isAdminRoute || $page.url.pathname === '/signin';
	$: isGlobalAdminRoute =
		$page.url.pathname === '/admin' ||
		$page.url.pathname === '/admin/global' ||
		$page.url.pathname.startsWith('/admin/global/') ||
		$page.url.pathname === '/signin';
	$: isEventsIndex = $page.url.pathname === '/events';
	$: publicHomeHref = isEventsIndex ? '/events' : publicNav.home;
	$: publicHeaderTitle = activePublicEventPage?.headerTitle ?? 'Grand Feast EU UK';
	$: publicFooterKicker = activePublicEventPage?.footerKicker ?? 'Events archive';
	$: publicFooterTitle = activePublicEventPage?.footerTitle ?? 'Grand Feast Europe and UK';
	$: publicFooterYear = activePublicEventPage?.footerCopyrightYear ?? new Date().getUTCFullYear();
	$: organizerHref = $page.params.event_id
		? adminRoutes($page.params.event_id).home
		: adminIndexRoute;
	$: adminThemeStyle = getAdminThemeStyle(
		isGlobalAdminRoute ? neutralAdminTheme : ($page.data.event as AdminThemeEvent | undefined)
	);
</script>

{#if isNeutralSiteRoute}
	<div class="admin-shell text-slate-950" style={adminThemeStyle}>
		<header class="admin-header border-b border-slate-200/80 px-4 py-6 md:px-8">
			<div
				class="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between"
			>
				<div class="flex items-center justify-between">
					<a href={publicNav.home} on:click={closeMenu}>
						<h1 class="text-2xl font-bold tracking-wider text-slate-950">Grand Feast EU UK</h1>
					</a>

					<div class="flex items-center gap-3 md:hidden">
						{#if $page.data.session?.user}
							<button
								type="button"
								class="text-sm font-semibold text-red-700 hover:text-red-800"
								on:click={signOutCurrentUser}
							>
								Sign out
							</button>
						{/if}

						<button
							type="button"
							class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900"
							aria-expanded={isMenuOpen}
							aria-controls="site-nav"
							on:click={toggleMenu}
						>
							Menu
						</button>
					</div>
				</div>

				<nav id="site-nav" class:hidden={!isMenuOpen} class="md:block">
					<ul class="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
						<li>
							<a
								href={adminIndexRoute}
								class="text-slate-700 underline decoration-slate-400 underline-offset-4 transition hover:text-slate-950"
								on:click={closeMenu}>Admin Home</a
							>
						</li>
						{#if $page.data.session?.user}
							<li class="hidden text-slate-600 md:block">
								<a href="/signin" class="transition hover:text-slate-950">
									{$page.data.session.user.email}
								</a>
							</li>
							<li class="hidden md:block">
								<button
									type="button"
									class="font-semibold text-red-700 hover:text-red-800"
									on:click={signOutCurrentUser}
								>
									Sign out
								</button>
							</li>
						{/if}
					</ul>
				</nav>
			</div>
		</header>

		<slot />
	</div>
{:else}
	<div class="public-site-shell" class:events-index-shell={isEventsIndex}>
		<header class="public-content px-4 py-5 md:px-8">
			<div
				class="mx-auto flex max-w-6xl flex-col gap-4 rounded-xl border border-white/10 bg-[#021821]/80 px-4 py-4 shadow-xl backdrop-blur md:flex-row md:items-center md:justify-between md:px-5"
			>
				<div class="flex items-center justify-between">
					<a href={publicHomeHref} on:click={closeMenu} class="group">
						<p class="conference-kicker">Grand Feast</p>
						<h1 class="text-2xl font-black tracking-normal text-white">{publicHeaderTitle}</h1>
					</a>

					<button
						type="button"
						class="public-header-menu-button conference-button-secondary px-3 py-2 text-sm"
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
								href={publicHomeHref}
								class="font-semibold text-[#fff3df]/80 transition hover:text-white"
								on:click={closeMenu}>Home</a
							>
						</li>
						{#if activePublicEventPage}
							<li>
								<a
									href={`${publicNav.home}#${activePublicEventPage.status === 'archived' ? 'message' : 'speakers'}`}
									class="font-semibold text-[#fff3df]/80 transition hover:text-white"
									on:click={closeMenu}
								>
									{activePublicEventPage.status === 'archived' ? 'Message' : 'Speakers'}
								</a>
							</li>
							<li>
								<a
									href={`${publicNav.home}#details`}
									class="font-semibold text-[#fff3df]/80 transition hover:text-white"
									on:click={closeMenu}>Details</a
								>
							</li>
							{#if activePublicEventPage.showBuyTickets}
								<li>
									<a
										href={publicNav.newBooking}
										class="conference-button px-4 py-2 text-sm"
										on:click={closeMenu}>Buy Tickets</a
									>
								</li>
							{:else}
								<li>
									<a
										href={`${publicNav.home}#tickets`}
										class="font-semibold text-[#fff3df]/80 transition hover:text-white"
										on:click={closeMenu}>Tickets</a
									>
								</li>
							{/if}
						{/if}
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
						<p class="conference-kicker">{publicFooterKicker}</p>
						<p class="mt-2 text-lg font-black text-white">{publicFooterTitle}</p>
						<p class="mt-1 text-sm text-[#fff3df]/70">
							© {publicFooterYear} Grand Feast Europe and UK.
						</p>
					</div>
					<div class="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
						<a href={publicNav.conditions} class="text-[#fff3df]/75 transition hover:text-white">
							Terms &amp; Conditions
						</a>
						<a href={publicNav.privacy} class="text-[#fff3df]/75 transition hover:text-white">
							Privacy Policy
						</a>
						<a href={publicNav.faq} class="text-[#fff3df]/75 transition hover:text-white">FAQ</a>
						<a href="/events" class="text-[#fff3df]/75 transition hover:text-white"> All Events </a>
						<a
							href={organizerHref}
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
