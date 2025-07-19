// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import PocketBase from 'pocketbase';
declare global {
	namespace App {
		interface Locals {
			pb: PocketBase;
			user: Record<string, any> | null; // 👈 Add this line
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
