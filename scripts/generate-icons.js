import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = join(__dirname, '..', 'static', 'proxifeast.jpeg');

async function generateIcons() {
	console.log('Generating PWA icons from proxifeast.jpeg...');

	// Generate PWA icons at various sizes
	for (const size of sizes) {
		const outputFile = join(__dirname, '..', 'static', 'icons', `icon-${size}x${size}.png`);

		try {
			await sharp(inputFile)
				.resize(size, size, { fit: 'cover', position: 'center' })
				.png()
				.toFile(outputFile);

			console.log(`✓ Generated icon-${size}x${size}.png`);
		} catch (error) {
			console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
		}
	}

	// Generate favicon.png (32x32)
	try {
		await sharp(inputFile)
			.resize(32, 32, { fit: 'cover', position: 'center' })
			.png()
			.toFile(join(__dirname, '..', 'static', 'favicon.png'));

		console.log('✓ Generated favicon.png');
	} catch (error) {
		console.error('✗ Failed to generate favicon:', error.message);
	}

	// Generate Apple touch icon (180x180)
	try {
		await sharp(inputFile)
			.resize(180, 180, { fit: 'cover', position: 'center' })
			.png()
			.toFile(join(__dirname, '..', 'static', 'apple-touch-icon.png'));

		console.log('✓ Generated apple-touch-icon.png');
	} catch (error) {
		console.error('✗ Failed to generate apple-touch-icon:', error.message);
	}

	// Generate SVG icon for mask-icon
	try {
		// For SVG, we'll create a simple one that references the image
		const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <image href="proxifeast.jpeg" width="512" height="512"/>
</svg>`;

		const fs = await import('fs');
		fs.writeFileSync(join(__dirname, '..', 'static', 'icons', 'icon.svg'), svgContent);

		console.log('✓ Generated icon.svg');
	} catch (error) {
		console.error('✗ Failed to generate icon.svg:', error.message);
	}

	console.log('\nIcon generation complete!');
}

generateIcons();
