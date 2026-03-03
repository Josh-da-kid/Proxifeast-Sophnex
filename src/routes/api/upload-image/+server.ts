import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const restaurantId = url.searchParams.get('restaurantId');
	const imageType = url.searchParams.get('type') || 'image';

	if (!restaurantId) {
		return json({ error: 'Restaurant ID required' }, { status: 400 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		console.log('Uploading file:', file.name, 'type:', imageType);

		// Map the image type to the correct PocketBase field
		const fieldMap: Record<string, string> = {
			logo: 'logo',
			banner: 'banner',
			image: 'image'
		};

		const fieldName = fieldMap[imageType] || 'image';
		console.log('Using field name:', fieldName);

		// Create FormData for PocketBase with proper field
		const pbFormData = new FormData();
		pbFormData.append(fieldName, file);

		// Upload to PocketBase - update with the file
		try {
			await locals.pb.collection('restaurants').update(restaurantId, pbFormData);
		} catch (pbError: any) {
			console.error('PocketBase update error:', pbError);
			return json({ error: 'PocketBase error: ' + JSON.stringify(pbError.data) }, { status: 500 });
		}

		// Get the updated record to get the file URL
		const updatedRestaurant = await locals.pb.collection('restaurants').getOne(restaurantId);
		console.log(
			'Updated restaurant:',
			updatedRestaurant.id,
			'fields:',
			Object.keys(updatedRestaurant)
		);

		// Get the file URL based on field name
		const fileField = updatedRestaurant[`${fieldName}Url`];
		console.log('File field:', fieldName + 'Url', 'value:', fileField);

		// Also check for just the field itself (some PocketBase setups)
		const fileFieldRaw = updatedRestaurant[fieldName];
		console.log('Raw file field:', fieldName, 'value:', fileFieldRaw);

		if (fileField) {
			// Return the full URL
			const fullUrl = locals.pb.files.getUrl(updatedRestaurant, fileField);
			console.log('Full URL:', fullUrl);
			return json({ url: fullUrl });
		} else if (fileFieldRaw) {
			// Try with raw field
			const fullUrl = locals.pb.files.getUrl(updatedRestaurant, fileFieldRaw);
			console.log('Full URL (raw):', fullUrl);
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
