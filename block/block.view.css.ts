namespace $ {

	$mol_style_define( $bog_wysiwyg_block, {

		display: 'block',
		outline: 'none',
		position: 'relative',
		minWidth: 0,
		maxWidth: '100%',
		minHeight: '1.5em',
		lineHeight: '1.6',
		borderRadius: '0.25rem',
		cursor: 'text',
		padding: {
			top: '0.25rem',
			bottom: '0.25rem',
			left: '0.5rem',
			right: '0.5rem',
		},

		/** `anywhere` also shrinks min-content width, so a long word cannot push the page sideways */
		overflowWrap: 'anywhere',
		transition: 'background-color 0.15s, box-shadow 0.15s',

		':hover': {
			background: {
				color: $mol_theme.hover,
			},
		},

		/** Focused block keeps the hover tint plus an accent bar so the caret position is obvious */
		':focus': {
			outline: 'none',
			background: {
				color: $mol_theme.hover,
			},
			box: {
				shadow: [
					{
						inset: true,
						x: '2px',
						y: 0,
						blur: 0,
						spread: 0,
						color: $mol_theme.focus,
					},
				],
			},
		},

		'[bog_wysiwyg_block_empty]': {
			'true': {
				'::before': {
					content: 'attr(bog_wysiwyg_block_placeholder)',
					color: $mol_theme.shade,
					pointerEvents: 'none',
					position: 'absolute',
					/** Same line box as the first text line, so nothing shifts once typing starts */
					lineHeight: 'inherit',
					maxWidth: $mol_style_func.calc( '100% - 1rem' ),
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				},
			},
		},

		'[bog_wysiwyg_block_type]': {
			heading: {
				'[bog_wysiwyg_block_level]': {
					'1': {
						font: { size: '2rem', weight: 700 },
						lineHeight: '1.2',
						margin: { top: '2rem', bottom: '0.5rem' },
					},
					'2': {
						font: { size: '1.5rem', weight: 700 },
						lineHeight: '1.3',
						margin: { top: '1.5rem', bottom: '0.25rem' },
					},
					'3': {
						font: { size: '1.25rem', weight: 600 },
						lineHeight: '1.4',
						margin: { top: '1rem', bottom: '0.25rem' },
					},
				},
			},
			code: {
				font: { family: 'monospace', size: '0.875rem' },
				background: { color: $mol_theme.card },
				padding: {
					top: '1rem',
					bottom: '1rem',
					left: '1rem',
					right: '1rem',
				},
				margin: { top: '0.5rem', bottom: '0.5rem' },
				borderRadius: '0.5rem',
				whiteSpace: 'pre-wrap',
				/** Own scroll container: an unbreakable line scrolls here, never the page */
				overflow: { x: 'auto', y: 'hidden' },
			},
			quote: {
				border: {
					left: {
						width: '3px',
						style: 'solid',
						color: $mol_theme.focus,
					},
				},
				padding: { left: '1rem' },
				margin: { top: '0.5rem', bottom: '0.5rem' },
				color: $mol_theme.shade,
				font: { style: 'italic' },
			},
			divider: {
				border: {
					top: {
						width: '1px',
						style: 'solid',
						color: $mol_theme.line,
					},
				},
				minHeight: 0,
				padding: {
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
				},
				margin: { top: '1rem', bottom: '1rem' },
				pointerEvents: 'none',
			},
			image: {
				cursor: 'default',
				padding: {
					top: '0.5rem',
					bottom: '0.5rem',
					left: 0,
					right: 0,
				},
				margin: { top: '0.5rem', bottom: '0.5rem' },
				textAlign: 'center',
			},

			/**
			 * One block is one item, and the reader draws a bullet for each. Without this the
			 * editor drew none, so a list looked exactly like a run of paragraphs.
			 */
			list: {
				padding: { left: '2rem' },

				'::before': {
					content: '"\\2022"',
					position: 'absolute',
					left: '0.75rem',
					color: $mol_theme.shade,
					pointerEvents: 'none',
				},
			},
		},

		'@media': {
			'(max-width: 640px)': {

				padding: {
					top: '0.25rem',
					bottom: '0.25rem',
					left: '0.375rem',
					right: '0.375rem',
				},

				'[bog_wysiwyg_block_type]': {
					heading: {
						'[bog_wysiwyg_block_level]': {
							'1': {
								font: { size: '1.5rem' },
								margin: { top: '1.25rem', bottom: '0.375rem' },
							},
							'2': {
								font: { size: '1.25rem' },
								margin: { top: '1rem', bottom: '0.25rem' },
							},
							'3': {
								font: { size: '1.125rem' },
								margin: { top: '0.75rem', bottom: '0.25rem' },
							},
						},
					},
					code: {
						font: { size: '0.8125rem' },
						padding: {
							top: '0.75rem',
							bottom: '0.75rem',
							left: '0.75rem',
							right: '0.75rem',
						},
					},
					quote: {
						padding: { left: '0.75rem' },
					},
				},

			},
		},

	} )

	$mol_style_attach( 'bog_wysiwyg_block_inner', `
		[bog_wysiwyg_block] img {
			max-width: 100%;
			height: auto;
		}

		[bog_wysiwyg_block] a {
			overflow-wrap: anywhere;
		}

		[bog_wysiwyg_block] pre,
		[bog_wysiwyg_block] table {
			max-width: 100%;
			overflow-x: auto;
		}

		[bog_wysiwyg_block_type="image"] img {
			max-width: 100%;
			height: auto;
			border-radius: 0.5rem;
			display: block;
			margin: 0 auto;
		}

		[bog_wysiwyg_block_type="image"][bog_wysiwyg_block_empty="true"] {
			border: 2px dashed var(--mol_theme_line);
			border-radius: 0.5rem;
			min-height: 6rem;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
		}

		[bog_wysiwyg_block_type="image"][bog_wysiwyg_block_empty="true"]::before {
			content: "\\1F5BC  \\0414\\043E\\0431\\0430\\0432\\044C\\0442\\0435 \\043A\\0430\\0440\\0442\\0438\\043D\\043A\\0443";
			position: static;
			max-width: 100%;
			white-space: normal;
		}

		.bog_wysiwyg_wiki_link {
			color: var(--mol_theme_focus);
			text-decoration: none;
			border-bottom: 1px dashed var(--mol_theme_focus);
			cursor: pointer;
			overflow-wrap: anywhere;
		}

		.bog_wysiwyg_wiki_link:hover {
			border-bottom-style: solid;
		}
	` )

}
