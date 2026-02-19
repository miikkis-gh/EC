import type { Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
	// Log in development, send to analytics endpoint in production
	if (import.meta.env.DEV) {
		console.debug(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)}`);
		return;
	}

	// Send to /api/health or analytics service via beacon
	const body = JSON.stringify({
		name: metric.name,
		value: metric.value,
		rating: metric.rating,
		id: metric.id,
		navigationType: metric.navigationType
	});

	if (navigator.sendBeacon) {
		navigator.sendBeacon('/api/vitals', body);
	}
}

export async function reportWebVitals() {
	const { onCLS, onINP, onLCP, onFCP, onTTFB } = await import('web-vitals');

	onCLS(sendToAnalytics);
	onINP(sendToAnalytics);
	onLCP(sendToAnalytics);
	onFCP(sendToAnalytics);
	onTTFB(sendToAnalytics);
}
