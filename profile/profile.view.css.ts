namespace $ {

	$mol_style_define( $bog_wysiwyg_profile, {

		minWidth: 0,
		maxWidth: '100%',

		Id_row: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
			},
			justifyContent: 'center',
			minWidth: 0,
			gap: '0.25rem',
			padding: {
				top: '0.5rem',
				bottom: '0.5rem',
				left: 0,
				right: 0,
			},
		},

		Id_label: {
			flex: {
				shrink: 0,
			},
			font: {
				size: '0.75rem',
			},
			color: $mol_theme.shade,
		},

		Id_value: {
			minWidth: 0,
			maxWidth: '100%',
			font: {
				size: '0.75rem',
				family: 'monospace',
			},
			color: $mol_theme.shade,
			overflowWrap: 'anywhere',
		},

		'@media': {
			'(max-width: 640px)': {

				Id_row: {
					justifyContent: 'flex-start',
					padding: {
						top: '0.5rem',
						bottom: '0.5rem',
						left: '0.5rem',
						right: '0.5rem',
					},
				},

			},
		},

	} )

}
