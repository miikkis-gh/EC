import { env } from '$env/dynamic/public';

const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1600];

/**
 * Build a srcset string from the image variant naming convention.
 * Expects variants at `{basePath}-{width}w.webp` alongside the original at `{basePath}.webp`.
 */
export function imageSrcset(basePath: string, widths: number[] = DEFAULT_WIDTHS): string {
	// basePath is like /uploads/products/{id}/image-0.webp
	// variants are /uploads/products/{id}/image-0-320w.webp
	const ext = basePath.lastIndexOf('.');
	if (ext === -1) return '';

	const base = basePath.substring(0, ext);

	return widths
		.map((w) => `${imageUrl(`${base}-${w}w.webp`)} ${w}w`)
		.join(', ');
}

/**
 * Prepend the Medusa backend URL if the path is relative.
 */
export function imageUrl(path: string): string {
	if (!path) return '';
	if (path.startsWith('http://') || path.startsWith('https://')) return path;
	const base = env.PUBLIC_MEDUSA_URL || '';
	return `${base}${path}`;
}
