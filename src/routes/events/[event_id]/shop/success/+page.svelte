<script lang="ts">
	import { page } from '$app/stores';
	import { publicRoutes } from '$lib/navigation/adminRoutes';
	import type { ServerData } from './+page.server';

	export let data: ServerData;

	$: routes = publicRoutes($page.params.event_id);

	function formatMoney(value: number, currency = 'EUR') {
		return new Intl.NumberFormat('en-IE', {
			style: 'currency',
			currency
		}).format(value);
	}
</script>

<section class="px-4 py-16">
	<div class="conference-panel mx-auto max-w-3xl p-8">
		<p class="conference-kicker">Merchandise Reserved</p>
		<h1 class="mt-3 text-4xl font-black text-white">Thank you, {data.reservation.customer_name}</h1>
		<p class="mt-4 text-lg leading-8 text-[#fff3df]/78">
			Your merch reservation is confirmed. Please pay and collect it at the event merch desk.
		</p>

		<div class="mt-8 rounded-lg border border-white/10 bg-[#021821]/70 p-5">
			<dl class="grid gap-4 text-sm sm:grid-cols-2">
				<div>
					<dt class="font-black uppercase tracking-[0.16em] text-[#f3c15f]">Reference</dt>
					<dd class="mt-1 text-lg font-black text-white">{data.reservation.reservation_id}</dd>
				</div>
				<div>
					<dt class="font-black uppercase tracking-[0.16em] text-[#f3c15f]">Total Due</dt>
					<dd class="mt-1 text-lg font-black text-white">
						{formatMoney(data.reservation.amount_total, data.reservation.currency)}
					</dd>
				</div>
				<div>
					<dt class="font-black uppercase tracking-[0.16em] text-[#f3c15f]">Email</dt>
					<dd class="mt-1 text-white">{data.reservation.email}</dd>
				</div>
				<div>
					<dt class="font-black uppercase tracking-[0.16em] text-[#f3c15f]">Mobile</dt>
					<dd class="mt-1 text-white">{data.reservation.mobile}</dd>
				</div>
			</dl>
		</div>

		<div class="mt-8">
			<h2 class="text-2xl font-black text-white">Reserved Items</h2>
			<div class="mt-4 divide-y divide-white/10 rounded-lg border border-white/10">
				{#each data.reservation.items as item}
					<div class="p-4">
						<p class="font-black text-white">{item.quantity}x {item.product_name}</p>
						<p class="mt-1 text-sm text-[#fff3df]/70">
							{#if item.selected_size || item.selected_color}
								{[item.selected_size, item.selected_color].filter(Boolean).join(' / ')} |
							{/if}
							{formatMoney(item.unit_price * item.quantity, item.currency)}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-8 flex flex-col gap-3 sm:flex-row">
			<a href={routes.shop} class="conference-button-secondary px-5 py-3 text-sm">Back to Shop</a>
			<a href={routes.home} class="conference-button px-5 py-3 text-sm">Event Home</a>
		</div>
	</div>
</section>
