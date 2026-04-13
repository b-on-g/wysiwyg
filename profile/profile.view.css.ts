namespace $ {

	$mol_style_define( $bog_wysiwyg_profile, {

		Id_row: {
			flex: {
				direction: 'row',
			},
			justifyContent: 'center',
			gap: '0.25rem',
			padding: {
				top: '0.5rem',
				bottom: '0.5rem',
				left: 0,
				right: 0,
			},
		},

		Id_label: {
			font: {
				size: '0.75rem',
			},
			color: $mol_theme.shade,
		},

		Id_value: {
			font: {
				size: '0.75rem',
				family: 'monospace',
			},
			color: $mol_theme.shade,
		},

	} )

}
