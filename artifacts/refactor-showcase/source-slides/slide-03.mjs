import {
	jsx,
	jsxs,
	SlideShell,
	TitleBlock,
	SolutionCard,
	NoteCard,
	Grid,
	Panel,
	Shape,
	Text,
	theme
} from './deck-helpers.mjs';
import { textStyle } from '@oai/artifact-tool/presentation-jsx';

export async function slide03(presentation) {
	const slide = presentation.slides.add();

	slide.compose(
		jsx(SlideShell, {
			footer: 'The target architecture gave every concern a clearer home',
			children: jsxs(Grid, {
				width: 'fill',
				height: 'fill',
				rows: ['auto', 'fr(1)'],
				rowGap: 24,
				children: [
					jsx(TitleBlock, {
						eyebrow: 'Proposed Solution',
						title: 'Refactor toward explicit layers, explicit seams, and smaller responsibilities',
						subtitle:
							'The goal was not to make the app abstract for the sake of it. The goal was to make the next feature easier to build safely.',
						rightNote: {
							title: 'Design principles',
							lines: [
								'Routes should adapt requests, not own business rules.',
								'Application services should orchestrate use cases cleanly.',
								'Infrastructure should hide Mongo and external service details.'
							]
						}
					}),
					jsx(Grid, {
						width: 'fill',
						columns: ['fr(1.2)', 'fr(1.8)'],
						columnGap: 22,
						children: [
							jsx(NoteCard, {
								title: 'What we wanted from the new shape',
								fill: theme.panelAlt,
								textColor: theme.ink,
								accent: theme.green,
								lines: [
									'A predictable place for every new change.',
									'Framework-agnostic business logic where possible.',
									'Ports and adapters around external dependencies.',
									'Cleaner boundaries for testing, smoke checks, and future automation.'
								]
							}),
							jsxs(Grid, {
								width: 'fill',
								rows: ['fixed(170)', 'fr(1)'],
								rowGap: 18,
								children: [
									jsx(Grid, {
										width: 'fill',
										columns: [
											'fr(1)',
											'fixed(50)',
											'fr(1)',
											'fixed(50)',
											'fr(1)',
											'fixed(50)',
											'fr(1)',
											'fixed(50)',
											'fr(1)'
										],
										children: [
											jsx(Panel, {
												fill: '#E8F1F9',
												borderRadius: 16,
												padding: 12,
												child: jsx(Text, {
													value: 'routes',
													style: textStyle(
														`font: 16px Aptos Display; color: ${theme.blue}; weight: 700`
													),
													width: 'fill'
												})
											}),
											jsx(Panel, {
												align: 'center',
												valign: 'middle',
												child: jsx(Shape, {
													width: 42,
													height: 4,
													fill: theme.blue,
													borderRadius: 99
												})
											}),
											jsx(Panel, {
												fill: '#E2F1EE',
												borderRadius: 16,
												padding: 12,
												child: jsx(Text, {
													value: 'server/http',
													style: textStyle(
														`font: 16px Aptos Display; color: ${theme.teal}; weight: 700`
													),
													width: 'fill'
												})
											}),
											jsx(Panel, {
												align: 'center',
												valign: 'middle',
												child: jsx(Shape, {
													width: 42,
													height: 4,
													fill: theme.teal,
													borderRadius: 99
												})
											}),
											jsx(Panel, {
												fill: '#E7EEF9',
												borderRadius: 16,
												padding: 12,
												child: jsx(Text, {
													value: 'application',
													style: textStyle(
														`font: 16px Aptos Display; color: ${theme.blue}; weight: 700`
													),
													width: 'fill'
												})
											}),
											jsx(Panel, {
												align: 'center',
												valign: 'middle',
												child: jsx(Shape, {
													width: 42,
													height: 4,
													fill: theme.green,
													borderRadius: 99
												})
											}),
											jsx(Panel, {
												fill: '#EFEAF8',
												borderRadius: 16,
												padding: 12,
												child: jsx(Text, {
													value: 'domain',
													style: textStyle(`font: 16px Aptos Display; color: #6A5AA6; weight: 700`),
													width: 'fill'
												})
											}),
											jsx(Panel, {
												align: 'center',
												valign: 'middle',
												child: jsx(Shape, {
													width: 42,
													height: 4,
													fill: theme.warm,
													borderRadius: 99
												})
											}),
											jsx(Panel, {
												fill: '#F4EFE8',
												borderRadius: 16,
												padding: 12,
												child: jsx(Text, {
													value: 'infrastructure',
													style: textStyle(
														`font: 16px Aptos Display; color: ${theme.warmDark}; weight: 700`
													),
													width: 'fill'
												})
											})
										]
									}),
									jsx(Grid, {
										width: 'fill',
										columns: ['fr(1)', 'fr(1)', 'fr(1)'],
										columnGap: 14,
										children: [
											jsx(SolutionCard, {
												title: 'Clear layering',
												text: 'Domain rules, use cases, HTTP helpers, and infrastructure adapters were separated so a reader can orient quickly.',
												accent: theme.green
											}),
											jsx(SolutionCard, {
												title: 'Ports and adapters',
												text: 'Repositories, email sending, QR generation, and image storage became explicit seams instead of ambient dependencies.',
												accent: theme.teal
											}),
											jsx(SolutionCard, {
												title: 'Typed configuration',
												text: 'Environment and auth setup moved into infrastructure, making local and hosted behavior easier to understand.',
												accent: theme.blue
											}),
											jsx(SolutionCard, {
												title: 'Thin routes',
												text: 'Route handlers now focus on parsing, guarding, calling a service, and mapping outcomes back to the web layer.',
												accent: theme.warmDark
											}),
											jsx(SolutionCard, {
												title: 'Cleaner local onboarding',
												text: 'Bootstrap and dev-only paths were shaped so a local Mongo database and local auth can carry the app farther.',
												accent: theme.green
											}),
											jsx(SolutionCard, {
												title: 'Better for Codex too',
												text: 'When architecture is predictable, feature work becomes faster, less repetitive, and less likely to land in the wrong place.',
												accent: theme.teal
											})
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
