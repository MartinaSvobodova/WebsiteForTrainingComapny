<script lang="ts">
	import { enhance } from "$app/forms";
	import Course from "$lib/components/Course.svelte";
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

</script>
<div>
	{#each data.courses as course}
		<Course id={course.id} title={course.title} image={course.image} price={course.price} isOwned={course.isOwned}></Course>
	{/each}
	<form method="POST" action="?/addCourse" use:enhance>
    <button type="submit" class="btn-primary">
        Add Course
    </button>
</form>
</div>

<style>
</style>