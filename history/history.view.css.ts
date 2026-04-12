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
		gap: '0.5rem',

		':not([bog_wysiwyg_history_showed])': {
			display: 'none',
		},

		Save_button: {
			justifyContent: 'center',
			fontWeight: 'bold',
			background: {
				color: $mol_theme.control,
			},
			color: $mol_theme.back,
			border: {
				radius: $mol_gap.round,
			},
		},

		Version_list: {
			flex: {
				direction: 'column',
			},
			gap: '0.125rem',
		},

		Version: {
			border: {
				radius: $mol_gap.round,
			},
		},

	} )

	$mol_style_define( $bog_wysiwyg_history_version, {
		'@': {
			'bog_wysiwyg_history_version_active': {
				'true': {
					background: {
						color: $mol_theme.hover,
					},
					font: {
						weight: 'bold',
					},
				},
			},
		},
	} )

}
