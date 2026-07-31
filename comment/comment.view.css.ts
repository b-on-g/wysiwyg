namespace $ {

	$mol_style_define( $bog_wysiwyg_comment, {

		flex: {
			shrink: 0,
		},

		Comment_button: {
			opacity: 0,
			transition: 'opacity 0.15s',
			cursor: 'pointer',
			flex: {
				shrink: 0,
			},
			minWidth: '1.5rem',
			minHeight: '1.5rem',
			justifyContent: 'center',
			alignItems: 'center',
			border: {
				radius: $mol_gap.round,
			},
			padding: {
				top: '0.25rem',
				bottom: '0.25rem',
				left: '0.25rem',
				right: '0.25rem',
			},

			':focus-visible': {
				opacity: 1,
				outline: 'none',
				box: {
					shadow: [
						{
							inset: true,
							x: 0,
							y: 0,
							blur: 0,
							spread: '2px',
							color: $mol_theme.focus,
						},
					],
				},
			},
		},

		Comment_count: {
			font: {
				size: '0.75rem',
				weight: 600,
			},
			color: $mol_theme.focus,
		},

		Panel: {
			flex: {
				direction: 'column',
			},
			width: '18rem',
			minWidth: 0,
			maxWidth: $mol_style_func.calc( '100vw - 1rem' ),
			maxHeight: '24rem',
			background: {
				color: $mol_theme.card,
			},
			border: {
				radius: $mol_gap.round,
			},
			box: {
				shadow: [
					{
						inset: false,
						x: 0,
						y: '0.25rem',
						blur: '1rem',
						spread: 0,
						color: '#00000040',
					},
				],
			},
		},

		Panel_head: {
			flex: {
				direction: 'row',
				shrink: 0,
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			minWidth: 0,
			padding: {
				top: '0.5rem',
				bottom: '0.25rem',
				left: '0.75rem',
				right: '0.25rem',
			},
			border: {
				bottom: {
					width: '1px',
					style: 'solid',
					color: $mol_theme.line,
				},
			},
		},

		Panel_title: {
			font: {
				weight: 600,
			},
			minWidth: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		},

		Thread: {
			flex: {
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			overflow: 'auto',
		},

		'@': {
			'bog_wysiwyg_comment_has_comments': {
				'true': {
					Comment_button: {
						opacity: 1,
						color: $mol_theme.focus,
					},
				},
			},
		},

		'@media': {
			'(max-width: 640px)': {

				Comment_button: {
					opacity: 1,
					minWidth: '2rem',
					minHeight: '2rem',
				},

				/** Full-width sheet instead of a narrow column next to the text */
				Panel: {
					width: $mol_style_func.calc( '100vw - 1rem' ),
					maxHeight: '60vh',
				},

			},
		},

	} )

}
