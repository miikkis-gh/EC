import type { PageServerLoad } from './$types';
import { getCollections } from '$server/medusa';

export const load: PageServerLoad = async () => {
	try {
		const data = await getCollections({ limit: 50 });
		return {
			collections: data.collections
		};
	} catch {
		return {
			collections: []
		};
	}
};
