namespace $ {

	$mol_style_define( $bog_wysiwyg_graph, {
		flex: {
			direction: 'column',
			grow: 1,
		},
		position: 'relative',
		minHeight: '24rem',
		minWidth: '100%',
		overflow: 'hidden',
		border: {
			radius: $mol_gap.round,
		},
		background: {
			color: $mol_theme.card,
		},

		Canvas: {
			flex: {
				grow: 1,
			},
			width: '100%',
			height: '100%',
		},

		Empty: {
			flex: {
				grow: 1,
			},
			align: {
				items: 'center',
				self: 'center',
			},
			justify: {
				content: 'center',
			},
			color: $mol_theme.shade,
			font: {
				size: '1rem',
			},
		},
	} )

}
