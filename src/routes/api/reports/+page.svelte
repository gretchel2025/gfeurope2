<script lang="ts">
	import AdminCard from '$lib/components/admin/AdminCard.svelte';
	import AdminPage from '$lib/components/admin/AdminPage.svelte';
	import type { ServerData } from './+page.server';

	export let data: ServerData;
	const topCities = data.topCities ?? [];
	const ticketStateCharts = data.ticketStateCharts ?? [];
	const pieSize = 132;
	const pieRadius = 48;
	const pieCircumference = 2 * Math.PI * pieRadius;

	type TicketStateChart = ServerData['ticketStateCharts'][number];
	type TicketStateSegment = TicketStateChart['segments'][number];

	function getSegmentPercentage(segment: TicketStateSegment, total: number): number {
		if (total === 0) {
			return 0;
		}

		return (segment.value / total) * 100;
	}

	function getSegmentLength(segment: TicketStateSegment, total: number): number {
		if (total === 0) {
			return 0;
		}

		return (segment.value / total) * pieCircumference;
	}

	function getSegmentOffset(segments: TicketStateSegment[], index: number, total: number): number {
		if (total === 0) {
			return 0;
		}

		const priorValue = segments
			.slice(0, index)
			.reduce((sum, segment) => sum + segment.value, 0);

		return -1 * ((priorValue / total) * pieCircumference);
	}
</script>

<AdminPage title="Top Ticket Sales" subtitle="By city">
	<AdminCard title="Ticket Sales Distribution" subtitle="Available, reserved, and paid by ticket type.">
		<div class="grid gap-4 lg:grid-cols-2">
			{#each ticketStateCharts as chart}
				<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
					<div class="flex flex-col gap-6 sm:flex-row sm:items-center">
						<div class="relative mx-auto h-40 w-40 shrink-0">
							<svg
								viewBox={`0 0 ${pieSize} ${pieSize}`}
								class="-rotate-90 overflow-visible"
								role="img"
								aria-label={`${chart.title} ticket state distribution`}
							>
								<circle
									cx={pieSize / 2}
									cy={pieSize / 2}
									r={pieRadius}
									stroke="currentColor"
									stroke-width="24"
									fill="none"
									class="text-slate-200"
								/>

								{#if chart.total > 0}
									{#each chart.segments as segment, index}
										<circle
											cx={pieSize / 2}
											cy={pieSize / 2}
											r={pieRadius}
											stroke="currentColor"
											stroke-width="24"
											stroke-linecap="butt"
											fill="none"
											class={segment.colorClass}
											stroke-dasharray={`${getSegmentLength(segment, chart.total)} ${pieCircumference}`}
											stroke-dashoffset={getSegmentOffset(chart.segments, index, chart.total)}
										/>
									{/each}
								{/if}
							</svg>

							<div class="absolute inset-0 flex flex-col items-center justify-center text-center">
								<p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
									Total
								</p>
								<p class="text-3xl font-bold text-slate-950">{chart.total}</p>
							</div>
						</div>

						<div class="flex-1 space-y-3">
							<div>
								<h2 class="text-lg font-bold text-slate-950">{chart.title}</h2>
								<p class="text-sm text-slate-600">Share of current inventory state.</p>
							</div>

							<ul class="space-y-2">
								{#each chart.segments as segment}
									<li
										class="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
									>
										<div class="flex items-center gap-2">
											<span class={`h-3 w-3 rounded-full ${segment.colorClass.replace('text-', 'bg-')}`}></span>
											<span class="font-semibold text-slate-700">{segment.label}</span>
										</div>
										<div class="text-right">
											<p class="font-semibold text-slate-950">{segment.value}</p>
											<p class="text-xs text-slate-500">
												{getSegmentPercentage(segment, chart.total).toFixed(0)}%
											</p>
										</div>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</AdminCard>

	<AdminCard>
		<div class="space-y-4">
			{#each topCities as cityStat, index}
				<article class="rounded-md border border-slate-200 bg-slate-50 p-4">
					<div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
						<h2 class="text-lg font-bold text-slate-950">{index + 1}. {cityStat.cityName}</h2>
						<p class="text-sm font-semibold text-blue-700">
							{(cityStat.percentOfThisCitysBookingsOverAllBookings * 100).toFixed(2)}% of all
							bookings
						</p>
					</div>
					<dl class="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
						<div>
							<dt class="font-semibold text-slate-500">Tickets Booked</dt>
							<dd>{cityStat.totalBookings}</dd>
						</div>
						<div>
							<dt class="font-semibold text-slate-500">Paid / Unpaid</dt>
							<dd>{cityStat.totalPaidBookings} / {cityStat.totalUnpaidBookings}</dd>
						</div>
						<div>
							<dt class="font-semibold text-slate-500">Sold</dt>
							<dd>{(cityStat.percentOfPaidBookings * 100).toFixed(0)}%</dd>
						</div>
					</dl>
				</article>
			{:else}
				<p class="text-sm text-slate-600">No report data available yet.</p>
			{/each}
		</div>
	</AdminCard>
</AdminPage>
