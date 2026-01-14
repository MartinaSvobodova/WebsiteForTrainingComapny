<script lang="ts">
	import Course from "$lib/components/Course.svelte";
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

</script>
<div>
	{#each data.courses as course}
		<Course id={course.id} title={course.title} image={course.image} price={course.price} isOwned={course.isOwned}></Course>
	{/each}
</div>

<style>
</style>