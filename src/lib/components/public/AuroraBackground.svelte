<script lang="ts">
	type Star = {
		top: number;
		left: number;
		duration: number;
	};

	const stars: Star[] = Array.from({ length: 100 }, (_, index) => ({
		top: (index * 37) % 100,
		left: (index * 61) % 100,
		duration: 2 + ((index * 17) % 30) / 10
	}));
</script>

<div class="aurora-bg" aria-hidden="true">
	<div class="stars">
		{#each stars as star}
			<span
				class="star"
				style={`top: ${star.top}%; left: ${star.left}%; animation-duration: ${star.duration}s;`}
			/>
		{/each}
	</div>
	<div class="aurora aurora-1"></div>
	<div class="aurora aurora-2"></div>
	<div class="aurora aurora-3"></div>
	<div class="aurora aurora-4"></div>
</div>
