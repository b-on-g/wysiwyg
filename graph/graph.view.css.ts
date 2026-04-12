namespace $ {

	$mol_style_define( $bog_wysiwyg_graph, {
		flex: {
			direction: 'column',
			grow: 1,
		},
		minHeight: '24rem',
		width: '100%',
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
		},
	} )

}
