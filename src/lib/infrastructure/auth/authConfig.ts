/**
 * Purpose:
 * This file configures Better Auth providers for the app.
 *
 * Why this structure is good:
 * Auth wiring is infrastructure, not business logic. Keeping provider setup
 * here isolates third-party auth details and keeps hooks/routes simpler.
 */
import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { oAuthProxy } from 'better-auth/plugins';
import { MongoClient } from 'mongodb';
import { appConfig } from '$lib/infrastructure/config/env.server';

const localBaseUrl = 'http://localhost:5173';
const devPreviewUrl = 'https://dev--grand-feast-uk-x-europe.netlify.app';
const prodBranchUrl = 'https://prod--grand-feast-uk-x-europe.netlify.app';
const productionUrl = 'https://www.grandfeast.eu';
const deployPreviewOriginPattern = 'https://deploy-preview-*--grand-feast-uk-x-europe.netlify.app';

const authMongoClient = appConfig.mongoUri
	? new MongoClient(appConfig.mongoUri, {
			serverSelectionTimeoutMS: appConfig.mongoConnectTimeoutMs
		})
	: null;

const authDatabase = authMongoClient ? authMongoClient.db() : null;
const socialProviders =
	appConfig.googleClientId && appConfig.googleClientSecret
		? {
				google: {
					clientId: appConfig.googleClientId,
					clientSecret: appConfig.googleClientSecret
				}
			}
		: undefined;

export const localAdminAuthPassword = 'local-admin-development-password';

export async function betterAuthUserExists(email: string): Promise<boolean> {
	if (!authDatabase) {
		return false;
	}

	const user = await authDatabase.collection('user').findOne({ email });
	return Boolean(user);
}

export async function markBetterAuthUserEmailVerified(email: string): Promise<void> {
	if (!authDatabase) {
		return;
	}

	await authDatabase.collection('user').updateOne(
		{ email },
		{
			$set: {
				emailVerified: true,
				updatedAt: new Date()
			}
		}
	);
}

/** Exposes the Better Auth instance used by the SvelteKit request handler and server helpers. */
export const auth = betterAuth({
	baseURL: appConfig.dev
		? appConfig.appBaseUrl || localBaseUrl
		: {
				allowedHosts: [
					'grandfeast.eu',
					'www.grandfeast.eu',
					'dev--grand-feast-uk-x-europe.netlify.app',
					'prod--grand-feast-uk-x-europe.netlify.app',
					'deploy-preview-*--grand-feast-uk-x-europe.netlify.app'
				],
				fallback: getAuthProxyUrl(),
				protocol: 'https'
			},
	basePath: '/api/auth',
	secret: appConfig.authSecret || undefined,
	database: authDatabase
		? mongodbAdapter(authDatabase, {
				transaction: false
			})
		: undefined,
	emailAndPassword: {
		enabled: appConfig.dev && appConfig.localAdminEmails.length > 0,
		requireEmailVerification: false,
		minPasswordLength: 8
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['email-password', 'google']
		}
	},
	socialProviders,
	trustedOrigins: [
		localBaseUrl,
		appConfig.appBaseUrl,
		devPreviewUrl,
		prodBranchUrl,
		productionUrl,
		'https://grandfeast.eu',
		deployPreviewOriginPattern,
		process.env.DEPLOY_PRIME_URL
	].filter(Boolean) as string[],
	plugins: [
		oAuthProxy({
			productionURL: getAuthProxyUrl(),
			secret: appConfig.authSecret || undefined
		}),
		sveltekitCookies(getRequestEvent)
	]
});

function getAuthProxyUrl(): string {
	if (appConfig.betterAuthProxyUrl) {
		return appConfig.betterAuthProxyUrl;
	}

	if (appConfig.dev) {
		return appConfig.appBaseUrl || localBaseUrl;
	}

	if (appConfig.netlifyContext === 'production' || appConfig.netlifyBranch === 'prod') {
		return productionUrl;
	}

	return devPreviewUrl;
}
