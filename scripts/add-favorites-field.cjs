const PocketBase = require('pocketbase').default;

const pb = new PocketBase('https://playgzero.pb.itcass.net');

async function addFavoritesField() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword('admin@proxifeast.com', 'Proxifeast2024!');

		// Update users collection to add favorites field
		const collection = await pb.collections.getOne('users');

		// Check if favorites field already exists
		const hasFavoritesField = collection.fields.some((f) => f.name === 'favorites');

		if (!hasFavoritesField) {
			collection.fields.push({
				name: 'favorites',
				type: 'json',
				required: false,
				options: {}
			});

			await pb.collections.update('users', collection);
			console.log('✅ Successfully added "favorites" field to users collection');
		} else {
			console.log('ℹ️  "favorites" field already exists in users collection');
		}

		// Test the field
		const testUser = await pb.collection('users').getList(1, 1);
		console.log('✅ Users collection is accessible');
	} catch (err) {
		console.error('❌ Error:', err);
	}
}

addFavoritesField();
