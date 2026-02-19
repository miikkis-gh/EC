const CLOUDINARY_BASE = 'https://res.cloudinary.com';

interface CloudinaryOptions {
	width?: number;
	height?: number;
	quality?: number | 'auto';
	format?: 'auto' | 'webp' | 'avif';
	crop?: 'fill' | 'fit' | 'scale' | 'thumb';
}

export function cloudinaryUrl(
	url: string,
	options: CloudinaryOptions = {}
): string {
	if (!url || !url.includes('cloudinary.com')) return url;

	const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options;

	const transforms: string[] = [`f_${format}`, `q_${quality}`];
	if (width) transforms.push(`w_${width}`);
	if (height) transforms.push(`h_${height}`);
	if (crop) transforms.push(`c_${crop}`);

	const parts = url.split('/upload/');
	if (parts.length !== 2) return url;

	return `${parts[0]}/upload/${transforms.join(',')}/${parts[1]}`;
}

export function cloudinarySrcset(
	url: string,
	widths: number[] = [320, 640, 768, 1024, 1280]
): string {
	if (!url || !url.includes('cloudinary.com')) return '';

	return widths
		.map((w) => `${cloudinaryUrl(url, { width: w })} ${w}w`)
		.join(', ');
}
