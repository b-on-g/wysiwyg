namespace $ {

	$mol_style_define( $bog_wysiwyg_menu, {

		position: 'absolute',
		zIndex: 100,
		background: {
			color: $mol_theme.back,
		},
		borderRadius: '0.5rem',
		padding: {
			top: '0.25rem',
			bottom: '0.25rem',
		},
		minWidth: '12rem',
		flex: {
			direction: 'column',
		},
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
			'[bog_wysiwyg_menu_option_active]': {
				'true': {
					background: {
						color: $mol_theme.hover,
					},
				},
			},
		},

	} )

}
