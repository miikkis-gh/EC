import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'ec1:recently-viewed';
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
	id: string;
	handle: string;
	title: string;
	thumbnail: string | null;
	price: number;
	currencyCode: string;
}

function loadFromStorage(): RecentlyViewedItem[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveToStorage(items: RecentlyViewedItem[]) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {
		// Storage full or unavailable
	}
}

export const recentlyViewed = writable<RecentlyViewedItem[]>(loadFromStorage());

export function addRecentlyViewed(product: {
	id: string;
	handle: string;
	title: string;
	thumbnail: string | null;
	variants?: {
		calculated_price?: { calculated_amount: number; currency_code: string };
		prices?: { amount: number; currency_code: string }[];
	}[];
}) {
	if (!browser) return;

	const price =
		product.variants?.[0]?.calculated_price?.calculated_amount ??
		product.variants?.[0]?.prices?.[0]?.amount ??
		0;
	const currencyCode =
		product.variants?.[0]?.calculated_price?.currency_code ??
		product.variants?.[0]?.prices?.[0]?.currency_code ??
		'eur';

	const item: RecentlyViewedItem = {
		id: product.id,
		handle: product.handle,
		title: product.title,
		thumbnail: product.thumbnail,
		price,
		currencyCode
	};

	recentlyViewed.update((items) => {
		const filtered = items.filter((i) => i.id !== item.id);
		const updated = [item, ...filtered].slice(0, MAX_ITEMS);
		saveToStorage(updated);
		return updated;
	});
}
