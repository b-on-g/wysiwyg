namespace $ {

	$mol_style_define( $bog_wysiwyg_prompt, {

		/** Anchored at the caret like the slash menu, and pinned the same way. */
		position: 'fixed',
		zIndex: 100,
		bottom: '0.5rem',
		right: '0.5rem',
		maxHeight: 'fit-content',
		maxWidth: 'fit-content',

		background: {
			color: $mol_theme.back,
		},
		border: {
			width: '1px',
			style: 'solid',
			color: $mol_theme.line,
		},
		borderRadius: '0.5rem',
		padding: '0.5rem',
		minWidth: '18rem',
		flex: {
			direction: 'column',
		},
		gap: '0.25rem',
		box: {
			shadow: [
				{
					inset: false,
					x: 0,
					y: '0.25rem',
					blur: '1rem',
					spread: 0,
					color: '#00000026',
				},
			],
		},

		':not([bog_wysiwyg_prompt_showed])': {
			display: 'none',
		},

		Label: {
			color: $mol_theme.shade,
			font: {
				size: '0.75rem',
			},
		},

		Row: {
			gap: '0.25rem',
			alignItems: 'stretch',
		},

		Field: {
			flex: {
				grow: 1,
			},
			minWidth: 0,
		},

		Submit: {
			flex: {
				shrink: 0,
			},
		},

		Open: {
			justifyContent: 'flex-start',
			gap: '0.25rem',
		},

	} )

}
