<script lang="ts">
	import { page } from '$app/stores';

	import { adminRoutes } from '$lib/navigation/adminRoutes';

	$: routes = adminRoutes($page.params.event_id);
</script>

<main
	class="admin-page-surface flex min-h-[calc(100vh-10rem)] items-start px-4 py-12 text-slate-900"
>
	<section
		role="dialog"
		aria-modal="false"
		aria-labelledby="email-sent-title"
		class="admin-card relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl p-8 text-center"
	>
		<div
			class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#005b72] via-[#d99a32] to-[#d64b55]"
		></div>
		<p class="text-xs font-black uppercase tracking-[0.22em] text-[#005b72]">Booking Email</p>
		<h1 id="email-sent-title" class="mt-4 text-3xl font-black tracking-tight text-slate-950">
			Booking Email Sent
		</h1>
		<p class="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
			The email was sent successfully. You can return to this booking or continue managing
			reservations.
		</p>

		<div class="mt-8 grid gap-3 sm:grid-cols-3">
			<a
				href="./"
				class="rounded-lg bg-[#005b72] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#044c61]"
			>
				Back to details
			</a>
			<a
				href={routes.booking.list}
				class="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
			>
				Bookings list
			</a>
			<a
				href={routes.home}
				class="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
			>
				Dashboard
			</a>
		</div>
	</section>
</main>
