export function formatPrice(amount: number, currencyCode: string = 'eur'): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currencyCode.toUpperCase(),
		minimumFractionDigits: 2
	}).format(amount / 100);
}

export function formatDate(date: string | Date): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(new Date(date));
}
