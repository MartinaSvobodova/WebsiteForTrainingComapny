<script lang="ts">
	import { page } from '$app/stores';
</script>

<div>
	Je tu error
	{$page.error?.message}
	<img src="https://httpcats.com/{$page.status}.jpg" alt="" />
</div>
