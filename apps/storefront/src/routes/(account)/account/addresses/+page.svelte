<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import * as Dialog from '$ui/dialog';
	import { Plus, Pencil, Trash2, MapPin } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { Address } from '$server/medusa';

	interface Props {
		data: {
			customer: { addresses: Address[] } | null;
		};
		form: { success?: boolean; error?: string } | null;
	}

	let { data, form }: Props = $props();
	let addresses = $derived(data.customer?.addresses ?? []);

	let addOpen = $state(false);
	let editAddress = $state<Address | null>(null);
	let editOpen = $derived(editAddress !== null);
	let deleteAddressId = $state<string | null>(null);
	let deleteOpen = $derived(deleteAddressId !== null);

	$effect(() => {
		if (form?.success) {
			addOpen = false;
			editAddress = null;
			deleteAddressId = null;
			toast.success('Address updated successfully');
		}
	});
</script>

<svelte:head>
	<title>Addresses — EC1</title>
</svelte:head>

<section class="rounded-xl border border-neutral-200 bg-white p-6">
	<div class="flex items-center justify-between">
		<h2 class="font-heading text-lg font-semibold text-neutral-900">Addresses</h2>
		<Button variant="outline" size="sm" onclick={() => (addOpen = true)}>
			<Plus class="mr-1 h-4 w-4" />
			Add address
		</Button>
	</div>

	{#if addresses.length === 0}
		<div class="mt-8 flex flex-col items-center gap-3 py-8 text-neutral-400">
			<MapPin class="h-12 w-12" />
			<p class="text-sm">No saved addresses yet.</p>
		</div>
	{:else}
		<div class="mt-4 grid gap-4 sm:grid-cols-2">
			{#each addresses as address (address.id)}
				<div class="relative rounded-lg border border-neutral-200 p-4">
					{#if address.is_default_shipping}
						<span class="mb-2 inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
							Default
						</span>
					{/if}
					<address class="text-sm not-italic leading-relaxed text-neutral-600">
						{[address.first_name, address.last_name].filter(Boolean).join(' ')}<br />
						{#if address.address_1}{address.address_1}<br />{/if}
						{#if address.address_2}{address.address_2}<br />{/if}
						{[address.city, address.province, address.postal_code].filter(Boolean).join(', ')}<br />
						{#if address.country_code}{address.country_code.toUpperCase()}{/if}
					</address>
					<div class="mt-3 flex gap-2">
						<button
							onclick={() => (editAddress = address)}
							class="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
						>
							<Pencil class="h-3 w-3" /> Edit
						</button>
						<button
							onclick={() => (deleteAddressId = address.id)}
							class="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
						>
							<Trash2 class="h-3 w-3" /> Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if form?.error}
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form.error}
		</div>
	{/if}
</section>

<!-- Add Address Dialog -->
<Dialog.Root bind:open={addOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add Address</Dialog.Title>
			<Dialog.Description>Add a new shipping address to your account.</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/add" use:enhance class="space-y-4">
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label for="add-first_name">First name</Label>
					<Input id="add-first_name" name="first_name" required />
				</div>
				<div>
					<Label for="add-last_name">Last name</Label>
					<Input id="add-last_name" name="last_name" required />
				</div>
			</div>
			<div>
				<Label for="add-address_1">Address</Label>
				<Input id="add-address_1" name="address_1" required />
			</div>
			<div>
				<Label for="add-address_2">Apartment, suite, etc.</Label>
				<Input id="add-address_2" name="address_2" />
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label for="add-city">City</Label>
					<Input id="add-city" name="city" required />
				</div>
				<div>
					<Label for="add-province">State / Province</Label>
					<Input id="add-province" name="province" />
				</div>
			</div>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label for="add-postal_code">Postal code</Label>
					<Input id="add-postal_code" name="postal_code" required />
				</div>
				<div>
					<Label for="add-country_code">Country code</Label>
					<Input id="add-country_code" name="country_code" required maxlength={2} placeholder="US" />
				</div>
			</div>
			<div>
				<Label for="add-phone">Phone</Label>
				<Input id="add-phone" name="phone" type="tel" />
			</div>
			<Dialog.Footer>
				<Dialog.Close>
					<Button variant="outline" type="button">Cancel</Button>
				</Dialog.Close>
				<Button type="submit">Add address</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Address Dialog -->
<Dialog.Root open={editOpen} onOpenChange={(v) => { if (!v) editAddress = null; }}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit Address</Dialog.Title>
			<Dialog.Description>Update this shipping address.</Dialog.Description>
		</Dialog.Header>
		{#if editAddress}
			<form method="POST" action="?/update" use:enhance class="space-y-4">
				<input type="hidden" name="address_id" value={editAddress.id} />
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<Label for="edit-first_name">First name</Label>
						<Input id="edit-first_name" name="first_name" required value={editAddress.first_name ?? ''} />
					</div>
					<div>
						<Label for="edit-last_name">Last name</Label>
						<Input id="edit-last_name" name="last_name" required value={editAddress.last_name ?? ''} />
					</div>
				</div>
				<div>
					<Label for="edit-address_1">Address</Label>
					<Input id="edit-address_1" name="address_1" required value={editAddress.address_1 ?? ''} />
				</div>
				<div>
					<Label for="edit-address_2">Apartment, suite, etc.</Label>
					<Input id="edit-address_2" name="address_2" value={editAddress.address_2 ?? ''} />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<Label for="edit-city">City</Label>
						<Input id="edit-city" name="city" required value={editAddress.city ?? ''} />
					</div>
					<div>
						<Label for="edit-province">State / Province</Label>
						<Input id="edit-province" name="province" value={editAddress.province ?? ''} />
					</div>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<Label for="edit-postal_code">Postal code</Label>
						<Input id="edit-postal_code" name="postal_code" required value={editAddress.postal_code ?? ''} />
					</div>
					<div>
						<Label for="edit-country_code">Country code</Label>
						<Input id="edit-country_code" name="country_code" required maxlength={2} value={editAddress.country_code ?? ''} />
					</div>
				</div>
				<div>
					<Label for="edit-phone">Phone</Label>
					<Input id="edit-phone" name="phone" type="tel" value={editAddress.phone ?? ''} />
				</div>
				<Dialog.Footer>
					<Button variant="outline" type="button" onclick={() => (editAddress = null)}>Cancel</Button>
					<Button type="submit">Save changes</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<Dialog.Root open={deleteOpen} onOpenChange={(v) => { if (!v) deleteAddressId = null; }}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Delete Address</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this address? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="address_id" value={deleteAddressId ?? ''} />
			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (deleteAddressId = null)}>Cancel</Button>
				<Button variant="destructive" type="submit">Delete</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
