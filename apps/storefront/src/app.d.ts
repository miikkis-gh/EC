/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			cartId: string | undefined;
		}
		interface PageData {
			cart?: import('$server/medusa').Cart;
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
