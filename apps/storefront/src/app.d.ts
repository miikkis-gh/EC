/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			cartId: string | undefined;
			user: import('$server/auth').AuthUser | null;
			session: import('$server/auth').Session | null;
		}
		interface PageData {
			cart?: import('$server/medusa').Cart;
			wishlistProductIds?: string[];
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
