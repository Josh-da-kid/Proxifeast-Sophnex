import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = join(__dirname, '..', 'static', 'icons', 'icon.svg');

async function generateIcons() {
	console.log('Generating PWA icons...');

	for (const size of sizes) {
		const outputFile = join(__dirname, '..', 'static', 'icons', `icon-${size}x${size}.png`);

		try {
			await sharp(inputFile).resize(size, size).png().toFile(outputFile);

			console.log(`✓ Generated icon-${size}x${size}.png`);
		} catch (error) {
			console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error.message);
		}
	}

	// Generate favicon.ico (multi-size)
	try {
		const favicon16 = await sharp(inputFile).resize(16, 16).png().toBuffer();
		const favicon32 = await sharp(inputFile).resize(32, 32).png().toBuffer();

		await sharp(inputFile)
			.resize(32, 32)
			.png()
			.toFile(join(__dirname, '..', 'static', 'favicon.png'));

		console.log('✓ Generated favicon.png');
	} catch (error) {
		console.error('✗ Failed to generate favicon:', error.message);
	}

	// Generate Apple touch icon
	try {
		await sharp(inputFile)
			.resize(180, 180)
			.png()
			.toFile(join(__dirname, '..', 'static', 'apple-touch-icon.png'));

		console.log('✓ Generated apple-touch-icon.png');
	} catch (error) {
		console.error('✗ Failed to generate apple-touch-icon:', error.message);
	}

	console.log('\nIcon generation complete!');
}

generateIcons();
