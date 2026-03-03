import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	const restaurantId = url.searchParams.get('restaurantId');

	if (!restaurantId) {
		return json({ error: 'Restaurant ID required' }, { status: 400 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Determine the field name based on the file type
		let fieldName = 'file';
		if (file.name.includes('logo')) {
			fieldName = 'logo';
		} else if (file.name.includes('banner')) {
			fieldName = 'banner';
		} else if (file.name.includes('image') || file.name.includes('gallery')) {
			fieldName = 'image';
		}

		// Create FormData for PocketBase with proper field
		const pbFormData = new FormData();
		pbFormData.append(fieldName, file);

		// Upload to PocketBase - update with the file
		await locals.pb.collection('restaurants').update(restaurantId, pbFormData);

		// Get the updated record to get the file URL
		const updatedRestaurant = await locals.pb.collection('restaurants').getOne(restaurantId);
		console.log('Updated restaurant fields:', Object.keys(updatedRestaurant));

		// Get the file URL based on field name
		const fileField = updatedRestaurant[`${fieldName}Url`];
		console.log('File field:', fieldName, 'URL:', fileField);

		if (fileField) {
			// Return the full URL
			const fullUrl = locals.pb.files.getUrl(updatedRestaurant, fileField);
			console.log('Full URL:', fullUrl);
			return json({ url: fullUrl });
		}

		// If no specific URL field, try to return the file directly
		const fileName = file.name;
		const directUrl = locals.pb.files.getUrl(updatedRestaurant, fileName);
		console.log('Direct URL:', directUrl);
		return json({ url: directUrl });
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Upload failed: ' + (error as Error).message }, { status: 500 });
	}
};
