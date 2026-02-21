<script lang="ts">
	import NewsletterSignup from './NewsletterSignup.svelte';
</script>

<footer class="border-t border-neutral-200 bg-neutral-50">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<NewsletterSignup />

		<div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4">
			<!-- Brand -->
			<div>
				<a href="/" class="font-heading text-lg font-bold text-neutral-900">EC1</a>
				<p class="mt-2 text-sm text-neutral-500">
					Quality products, curated for you.
				</p>
			</div>

			<!-- Shop Links -->
			<nav aria-label="Shop">
				<h3 class="text-sm font-semibold text-neutral-900">Shop</h3>
				<ul class="mt-3 space-y-2">
					<li>
						<a href="/products" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							All Products
						</a>
					</li>
					<li>
						<a href="/collections" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							Collections
						</a>
					</li>
				</ul>
			</nav>

			<!-- Company Links -->
			<nav aria-label="Company">
				<h3 class="text-sm font-semibold text-neutral-900">Company</h3>
				<ul class="mt-3 space-y-2">
					<li>
						<a href="/about" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							About
						</a>
					</li>
					<li>
						<a href="/blog" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							Blog
						</a>
					</li>
					<li>
						<a href="/contact" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							Contact
						</a>
					</li>
				</ul>
			</nav>

			<!-- Support Links -->
			<nav aria-label="Support">
				<h3 class="text-sm font-semibold text-neutral-900">Support</h3>
				<ul class="mt-3 space-y-2">
					<li>
						<a href="/account" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							My Account
						</a>
					</li>
					<li>
						<a href="/cart" class="text-sm text-neutral-500 transition-colors hover:text-neutral-900">
							Cart
						</a>
					</li>
				</ul>
			</nav>
		</div>

		<div class="mt-8 border-t border-neutral-200 pt-8 text-center">
			<p class="text-xs text-neutral-400">
				&copy; {new Date().getFullYear()} EC1. All rights reserved.
			</p>
		</div>
	</div>
</footer>
