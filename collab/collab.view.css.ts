namespace $ {

	$mol_style_define( $bog_wysiwyg_collab, {

		flex: {
			direction: 'row',
			shrink: 0,
			wrap: 'wrap',
		},
		alignItems: 'center',
		minWidth: 0,
		maxWidth: '100%',
		gap: '0.5rem',
		padding: {
			top: 0,
			bottom: '0.75rem',
			left: 0,
			right: 0,
		},

		Sync_icon: {
			flex: {
				shrink: 0,
			},
			fontSize: '0.75rem',
			whiteSpace: 'nowrap',
			cursor: 'default',

			'@': {
				'bog_wysiwyg_collab_status': {
					'online': {
						color: $mol_theme.focus,
					},
					'offline': {
						color: $mol_theme.shade,
					},
				},
			},
		},

		Peers: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
				shrink: 1,
			},
			minWidth: 0,
			gap: '0.25rem',
			alignItems: 'center',
		},

		Peer: {
			width: '1.75rem',
			height: '1.75rem',
			flex: {
				shrink: 0,
			},
			borderRadius: '50%',
			background: {
				color: $mol_theme.card,
			},
			color: $mol_theme.text,
			fontSize: '0.7rem',
			fontWeight: 'bold',
			textAlign: 'center',
			lineHeight: '1.75rem',
			cursor: 'default',
			overflow: 'hidden',
			justifyContent: 'center',
			alignItems: 'center',
		},

		'@media': {
			'(max-width: 640px)': {

				padding: {
					top: 0,
					bottom: '0.5rem',
					left: 0,
					right: 0,
				},

				Peer: {
					width: '1.5rem',
					height: '1.5rem',
					lineHeight: '1.5rem',
				},

			},
		},

	} )

}
