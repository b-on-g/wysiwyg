namespace $ {

	$mol_style_define( $bog_wysiwyg_menu, {

		position: 'fixed',
		zIndex: 100,

		/**
		 * `top`/`left` come as inline styles from the caret position.
		 * Pinning the opposite edges plus `fit-content` limits keeps the popup
		 * inside the viewport: while the content fits it is sized by content and
		 * anchored at the caret, otherwise it stretches to the edge and scrolls.
		 */
		bottom: '0.5rem',
		right: '0.5rem',
		maxHeight: 'fit-content',
		maxWidth: 'fit-content',
		overflow: {
			x: 'hidden',
			y: 'auto',
		},

		background: {
			color: $mol_theme.back,
		},
		border: {
			width: '1px',
			style: 'solid',
			color: $mol_theme.line,
		},
		borderRadius: '0.5rem',
		padding: {
			top: '0.25rem',
			bottom: '0.25rem',
			left: '0.25rem',
			right: '0.25rem',
		},
		minWidth: '12rem',
		flex: {
			direction: 'column',
		},
		gap: '0.0625rem',
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

		':not([bog_wysiwyg_menu_showed])': {
			display: 'none',
		},

		Option: {
			flex: {
				shrink: 0,
			},
			justifyContent: 'flex-start',
			textAlign: 'left',
			minWidth: 0,
			borderRadius: '0.25rem',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',

			':focus-visible': {
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

			'[bog_wysiwyg_menu_option_active]': {
				'true': {
					background: {
						color: $mol_theme.hover,
					},
					color: $mol_theme.focus,
				},
			},
		},

		'@media': {
			'(max-width: 640px)': {

				/** Let the popup shrink near the right edge of a narrow screen */
				minWidth: '9rem',

				Option: {
					padding: {
						top: '0.625rem',
						bottom: '0.625rem',
						left: '0.75rem',
						right: '0.75rem',
					},
				},

			},
		},

	} )

}
