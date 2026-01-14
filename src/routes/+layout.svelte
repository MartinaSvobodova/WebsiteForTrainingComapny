<script lang="ts">
	import './layout.css';
	import { SignIn, SignOut } from '@auth/sveltekit/components';
	import type { LayoutProps } from './$types';
	import '@skeletonlabs/skeleton/themes/cerberus';
	import logo from '$lib/assets/lgo.jpg';

	let { data, children }: LayoutProps = $props();
</script>

<link rel="icon" href={logo} />

<div class="min-h-100vh mx-1em flex flex-col">
	<nav class="btn-group flex flex-row preset-outlined-surface-200-800">
		<a href="/about" class="btn justify-self-start preset-outlined-primary-500"> About </a>
		<a href="/testimonials" class="btn justify-self-start preset-outlined-primary-500">
			Testimonials
		</a>
		<a href="/contact" class="btn justify-self-start preset-outlined-primary-500"> Contact </a>
		<div class="flex grow flex-row justify-end">
			{#if !data.session}
				<SignIn>
					<div slot="submitButton" class="buttonPrimary">Sign in</div>
				</SignIn>
			{:else}
				<SignOut>
					<div slot="submitButton" class="buttonPrimary">Sign out</div>
				</SignOut>
			{/if}
		</div>
	</nav>
	<header class="font-size-2rem <lg:flex-col flex flex-row justify-between">
		<div class="text-xl font-medium text-black dark:text-white flex flex-row justify-center">Company name here</div>
	</header>
	<main></main>
	<footer class="flex flex-row">
		<div class="justify-start">Contact</div>
		<div class="grow"></div>
		<a href="mailto:a@a.com" class="justify-end">email</a>
	</footer>
</div>

<style lang="scss">
	:global(body) {
		padding: 0;
		margin: 0;
	}
</style>

{@render children()}