import {
	jsx,
	jsxs,
	SlideShell,
	TitleBlock,
	WeaknessCard,
	NoteCard,
	Grid,
	Panel,
	Shape,
	Text,
	theme
} from './deck-helpers.mjs';
import { paint, textStyle } from '@oai/artifact-tool/presentation-jsx';

export async function slide02(presentation) {
	const slide = presentation.slides.add();

	slide.compose(
		jsx(SlideShell, {
			footer: 'Why the old structure was getting expensive to change',
			children: jsxs(Grid, {
				width: 'fill',
				height: 'fill',
				rows: ['auto', 'fr(1)'],
				rowGap: 24,
				children: [
					jsx(TitleBlock, {
						eyebrow: 'Before The Refactor',
						title: 'The code worked, but the shape of the code kept slowing us down',
						subtitle:
							'None of these issues were dramatic on their own. Together, they made changes harder to place, test, and reason about.',
						rightNote: {
							title: 'Typical developer friction',
							lines: [
								'Where should a new feature actually live?',
								'Is this a business rule or a route concern?',
								'Will changing this break setup, auth, or email side effects?'
							]
						}
					}),
					jsx(Grid, {
						width: 'fill',
						columns: ['fr(1.2)', 'fr(1.8)'],
						columnGap: 22,
						children: [
							jsx(NoteCard, {
								title: 'Symptoms we kept bumping into',
								fill: theme.darkPanel,
								textColor: theme.white,
								accent: theme.yellow,
								lines: [
									'Routes, workflows, and data access all made important decisions.',
									'SvelteKit-specific errors leaked deep into business logic.',
									'Type definitions and Mongo schemas had drifted apart.',
									'Debug, init, and testing routes cluttered the real app surface.',
									'Local development depended too much on production-ish assumptions.'
								]
							}),
							jsxs(Panel, {
								fill: theme.panel,
								line: paint('none'),
								borderRadius: 22,
								padding: 18,
								child: jsxs(Grid, {
									width: 'fill',
									rows: ['fixed(150)', 'fr(1)'],
									rowGap: 18,
									children: [
										jsxs(Panel, {
											fill: '#FBEEE8',
											borderRadius: 18,
											padding: 16,
											child: jsxs(Grid, {
												width: 'fill',
												height: 'fill',
												rows: ['auto', 'fr(1)'],
												rowGap: 10,
												children: [
													jsx(Text, {
														value: 'Illustration: one change touching too many places',
														style: textStyle(
															`font: 15px Aptos Display; color: ${theme.red}; weight: 700`
														)
													}),
													jsx(Grid, {
														width: 'fill',
														columns: ['fr(1)', 'fixed(48)', 'fr(1)', 'fixed(48)', 'fr(1)'],
														columnGap: 0,
														children: [
															jsx(Panel, {
																fill: '#F8DDD5',
																borderRadius: 16,
																padding: 12,
																child: jsx(Text, {
																	value: 'Route action',
																	style: textStyle(
																		`font: 14px Aptos Display; color: ${theme.ink}; weight: 700`
																	),
																	width: 'fill'
																})
															}),
															jsx(Panel, {
																align: 'center',
																valign: 'middle',
																child: jsx(Shape, {
																	width: 40,
																	height: 4,
																	fill: theme.red,
																	borderRadius: 99
																})
															}),
															jsx(Panel, {
																fill: '#F5E7DA',
																borderRadius: 16,
																padding: 12,
																child: jsx(Text, {
																	value: 'Workflow + HTTP errors',
																	style: textStyle(
																		`font: 14px Aptos Display; color: ${theme.ink}; weight: 700`
																	),
																	width: 'fill'
																})
															}),
															jsx(Panel, {
																align: 'center',
																valign: 'middle',
																child: jsx(Shape, {
																	width: 40,
																	height: 4,
																	fill: theme.red,
																	borderRadius: 99
																})
															}),
															jsx(Panel, {
																fill: '#F8EEE6',
																borderRadius: 16,
																padding: 12,
																child: jsx(Text, {
																	value: 'Mongo + email + media',
																	style: textStyle(
																		`font: 14px Aptos Display; color: ${theme.ink}; weight: 700`
																	),
																	width: 'fill'
																})
															})
														]
													})
												]
											})
										}),
										jsx(Grid, {
											width: 'fill',
											columns: ['fr(1)', 'fr(1)', 'fr(1)'],
											columnGap: 14,
											children: [
												jsx(WeaknessCard, {
													title: 'Blurry ownership',
													text: 'Feature logic was spread across routes, workflows, and persistence code, so every change began with a scavenger hunt.'
												}),
												jsx(WeaknessCard, {
													title: 'Framework leakage',
													text: 'Business services knew about SvelteKit error handling, which made them harder to test and harder to reuse cleanly.',
													tone: 'yellow'
												}),
												jsx(WeaknessCard, {
													title: 'Infra coupling',
													text: 'Email, Cloudinary, QR generation, auth, and bootstrap concerns sat too close to feature code.',
													tone: 'blue'
												}),
												jsx(WeaknessCard, {
													title: 'Type drift',
													text: 'Domain types and Mongo schemas disagreed in a few important places, which increased mental overhead and hidden bugs.'
												}),
												jsx(WeaknessCard, {
													title: 'Discovery noise',
													text: 'Old testing and debug routes looked real enough to distract people and search tools during implementation work.',
													tone: 'yellow'
												}),
												jsx(WeaknessCard, {
													title: 'Fragile local setup',
													text: 'The app assumed too much about remote services and non-empty data, so local onboarding was rougher than it needed to be.',
													tone: 'blue'
												})
											]
										})
									]
								})
							})
						]
					})
				]
			})
		})
	);

	return slide;
}
