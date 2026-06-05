import {
	jsx,
	jsxs,
	SlideShell,
	TitleBlock,
	NoteCard,
	Grid,
	Panel,
	Shape,
	Text,
	theme
} from './deck-helpers.mjs';
import { textStyle } from '@oai/artifact-tool/presentation-jsx';

function FlowBlock({ title, text, fill, accent }) {
	return jsx(Panel, {
		fill,
		borderRadius: 18,
		padding: 14,
		child: jsxs(Grid, {
			width: 'fill',
			rows: ['auto', 'auto'],
			rowGap: 6,
			children: [
				jsx(Text, {
					value: title,
					style: textStyle(`font: 16px Aptos Display; color: ${accent}; weight: 700`),
					width: 'fill'
				}),
				jsx(Text, {
					value: text,
					style: textStyle(`font: 12px Aptos; color: ${theme.ink}`),
					width: 'fill'
				})
			]
		})
	});
}

export async function slide06(presentation) {
	const slide = presentation.slides.add();

	slide.compose(
		jsx(SlideShell, {
			footer: 'Finished architecture: a request moves downward through clearer seams',
			children: jsxs(Grid, {
				width: 'fill',
				height: 'fill',
				rows: ['auto', 'fr(1)'],
				rowGap: 24,
				children: [
					jsx(TitleBlock, {
						eyebrow: 'Finished Application',
						title: 'What the refactored system looks like in motion',
						subtitle:
							'A request still accomplishes the same business job, but the responsibilities are much easier to trace end to end.',
						rightNote: {
							title: 'Concrete examples',
							lines: [
								'bookingService now coordinates the booking lifecycle cleanly.',
								'Repositories own Mongo access instead of feature code doing it ad hoc.',
								'Infrastructure adapters isolate auth, email, media, and bootstrap concerns.'
							]
						}
					}),
					jsx(Grid, {
						width: 'fill',
						columns: ['fr(1.6)', 'fr(0.9)'],
						columnGap: 22,
						children: [
							jsx(Panel, {
								fill: theme.panel,
								line: { color: theme.soft, width: 1 },
								borderRadius: 22,
								padding: 18,
								child: jsxs(Grid, {
									width: 'fill',
									rows: [
										'auto',
										'fixed(18)',
										'auto',
										'fixed(18)',
										'auto',
										'fixed(18)',
										'auto',
										'fixed(18)',
										'auto'
									],
									rowGap: 0,
									children: [
										jsx(FlowBlock, {
											title: '1. Routes',
											text: 'Public pages and admin pages receive the request and stay focused on web concerns.',
											fill: '#EDF4FA',
											accent: theme.blue
										}),
										jsx(Panel, {
											align: 'center',
											child: jsx(Shape, {
												width: 4,
												height: 18,
												fill: theme.blue,
												borderRadius: 99
											})
										}),
										jsx(FlowBlock, {
											title: '2. server/http helpers',
											text: 'Forms, guards, and app-error mapping keep request parsing and authorization consistent.',
											fill: '#E3F1EF',
											accent: theme.teal
										}),
										jsx(Panel, {
											align: 'center',
											child: jsx(Shape, {
												width: 4,
												height: 18,
												fill: theme.teal,
												borderRadius: 99
											})
										}),
										jsx(FlowBlock, {
											title: '3. Application services',
											text: 'Services such as bookingService and ticketService orchestrate use cases without being tied to SvelteKit.',
											fill: '#E8EEF9',
											accent: theme.blue
										}),
										jsx(Panel, {
											align: 'center',
											child: jsx(Shape, {
												width: 4,
												height: 18,
												fill: theme.green,
												borderRadius: 99
											})
										}),
										jsx(FlowBlock, {
											title: '4. Domain rules',
											text: 'Booking, ticket, counter, and user rules live in the domain layer where transitions are easier to review.',
											fill: '#F0ECF9',
											accent: '#6A5AA6'
										}),
										jsx(Panel, {
											align: 'center',
											child: jsx(Shape, {
												width: 4,
												height: 18,
												fill: theme.warmDark,
												borderRadius: 99
											})
										}),
										jsx(FlowBlock, {
											title: '5. Infrastructure adapters',
											text: 'Mongo repositories, auth config, bootstrap, email, QR generation, and media storage handle the outside world.',
											fill: '#F6F0E8',
											accent: theme.warmDark
										})
									]
								})
							}),
							jsx(Grid, {
								width: 'fill',
								rows: ['fr(1)', 'fr(1)'],
								rowGap: 16,
								children: [
									jsx(NoteCard, {
										title: 'Key modules in the finished app',
										fill: theme.panelAlt,
										textColor: theme.ink,
										accent: theme.green,
										lines: [
											'src/lib/application/services/bookingService.ts',
											'src/lib/server/http/services.ts',
											'src/lib/infrastructure/db/mongo/repositories.ts',
											'src/lib/infrastructure/auth/authConfig.ts'
										]
									}),
									jsx(NoteCard, {
										title: 'What this means for future work',
										fill: theme.darkPanel,
										textColor: theme.white,
										accent: theme.warm,
										lines: [
											'New features have clearer entry points.',
											'Refactors can target one layer at a time.',
											'Local development can move without production dependencies.'
										]
									})
								]
							})
						]
					})
				]
			})
		})
	);

	return slide;
}
