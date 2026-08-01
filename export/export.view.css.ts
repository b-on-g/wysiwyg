namespace $ {

	$mol_style_define( $bog_wysiwyg_export, {

		Bubble: {
			flex: { direction: 'column' },
			gap: $mol_gap.block,
			padding: $mol_gap.block,
			minWidth: '16rem',
			maxWidth: '48rem',
		},

		Head: {
			flex: { wrap: 'wrap' },
			align: { items: 'center' },
			gap: $mol_gap.text,
			minWidth: 0,
		},

		Dialect: {
			flex: { grow: 1 },
			minWidth: '10rem',
		},

		Note: {
			color: $mol_theme.shade,
			font: { size: '0.75rem' },
			padding: { left: $mol_gap.text, right: $mol_gap.text },
		},

		Body: {
			background: { color: $mol_theme.card },
			borderRadius: '0.5rem',
			minWidth: 0,
			minHeight: '6rem',
			maxHeight: '50vh',
		},

		Output: {
			minWidth: 0,
			padding: $mol_gap.text,
			font: { size: '0.8125rem' },
		},

		'@media': {
			'(max-width: 640px)': {

				Bubble: {
					minWidth: 0,
					gap: $mol_gap.text,
					padding: $mol_gap.text,
				},

				Dialect: {
					minWidth: 0,
				},

			},
		},

	} )

}
