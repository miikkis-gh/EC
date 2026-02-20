<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import { toast } from 'svelte-sonner';

	interface Props {
		data: {
			customer: {
				first_name: string | null;
				last_name: string | null;
				phone: string | null;
			} | null;
		};
		form: {
			profileSuccess?: boolean;
			profileError?: string;
			passwordSuccess?: boolean;
			passwordError?: string;
		} | null;
	}

	let { data, form }: Props = $props();
	let profileLoading = $state(false);
	let passwordLoading = $state(false);

	$effect(() => {
		if (form?.profileSuccess) {
			toast.success('Profile updated successfully');
		}
		if (form?.passwordSuccess) {
			toast.success('Password changed successfully');
		}
	});
</script>

<svelte:head>
	<title>Settings — EC1</title>
</svelte:head>

<div class="space-y-6">
	<!-- Profile -->
	<section class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="font-heading text-lg font-semibold text-neutral-900">Profile</h2>
		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				profileLoading = true;
				return async ({ update }) => {
					profileLoading = false;
					await update();
				};
			}}
			class="mt-4 space-y-4"
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label for="first_name">First name</Label>
					<Input
						id="first_name"
						name="first_name"
						value={data.customer?.first_name ?? ''}
					/>
				</div>
				<div>
					<Label for="last_name">Last name</Label>
					<Input
						id="last_name"
						name="last_name"
						value={data.customer?.last_name ?? ''}
					/>
				</div>
			</div>
			<div>
				<Label for="phone">Phone</Label>
				<Input
					id="phone"
					name="phone"
					type="tel"
					value={data.customer?.phone ?? ''}
				/>
			</div>

			{#if form?.profileError}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{form.profileError}
				</div>
			{/if}

			<Button type="submit" disabled={profileLoading}>
				{profileLoading ? 'Saving...' : 'Save changes'}
			</Button>
		</form>
	</section>

	<!-- Change Password -->
	<section class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="font-heading text-lg font-semibold text-neutral-900">Change Password</h2>
		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				passwordLoading = true;
				return async ({ update }) => {
					passwordLoading = false;
					await update();
				};
			}}
			class="mt-4 space-y-4"
		>
			<div>
				<Label for="current_password">Current password</Label>
				<Input id="current_password" name="current_password" type="password" required />
			</div>
			<div>
				<Label for="new_password">New password</Label>
				<Input id="new_password" name="new_password" type="password" required />
			</div>
			<div>
				<Label for="confirm_password">Confirm new password</Label>
				<Input id="confirm_password" name="confirm_password" type="password" required />
			</div>

			{#if form?.passwordError}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{form.passwordError}
				</div>
			{/if}

			<Button type="submit" disabled={passwordLoading}>
				{passwordLoading ? 'Changing...' : 'Change password'}
			</Button>
		</form>
	</section>
</div>
