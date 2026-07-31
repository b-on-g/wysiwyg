namespace $ {

	$mol_style_define( $bog_wysiwyg_graph, {

		flex: {
			direction: 'column',
			grow: 1,
			shrink: 1,
		},
		position: 'relative',
		minWidth: 0,
		maxWidth: '100%',
		height: '30rem',
		overflow: 'hidden',
		border: {
			radius: $mol_gap.round,
		},
		background: {
			color: $mol_theme.card,
		},

		'@media': {
			'(max-width: 640px)': {

				/** Canvas keeps a usable share of the screen instead of a fixed 30rem block */
				height: '60vh',
				minHeight: '16rem',

			},
		},

	} )

}
