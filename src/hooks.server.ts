import { bootstrapApplication } from '$lib/infrastructure/bootstrap/bootstrap';
import { building } from '$app/environment';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from './auth';

await bootstrapApplication();

export async function handle({ event, resolve }) {
	return svelteKitHandler({ event, resolve, auth, building });
}
