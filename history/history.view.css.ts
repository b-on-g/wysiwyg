namespace $ {

	$mol_style_define( $bog_wysiwyg_history, {

		flex: {
			direction: 'column',
		},
		padding: {
			top: '0.5rem',
			bottom: '0.5rem',
			left: '0.5rem',
			right: '0.5rem',
		},
		gap: '0.25rem',

		':not([bog_wysiwyg_history_showed])': {
			display: 'none',
		},

		Save_button: {
			justifyContent: 'center',
			fontWeight: 'bold',
		},

		Version_list: {
			flex: {
				direction: 'column',
			},
			gap: '0.125rem',
		},

		Version: {
			'[bog_wysiwyg_history_active]': {
				'true': {
					background: {
						color: $mol_theme.hover,
					},
				},
			},
		},

	} )

}
