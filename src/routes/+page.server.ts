import { appConfig } from '$lib/infrastructure/config/env.server';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { redirect } from '@sveltejs/kit';

export function load(): never {
	throw redirect(308, publicRoutes(appConfig.appEventId).home);
}
