namespace $ {

	$mol_style_define( $bog_wysiwyg, {
		position: 'relative',
		flex: {
			direction: 'column',
			grow: 1,
		},
		padding: {
			top: '2rem',
			bottom: '2rem',
			left: '3rem',
			right: '3rem',
		},
		maxWidth: '50rem',
		alignSelf: 'center',
		width: '100%',

		Block_row: {
			position: 'relative',
			flex: {
				direction: 'row',
			},
			alignItems: 'flex-start',
		},

		Drag_handle: {
			flex: {
				shrink: 0,
			},
			width: '1.5rem',
			cursor: 'grab',
			opacity: 0,
			transition: 'opacity 0.15s',
			alignSelf: 'center',
			textAlign: 'center',
			color: $mol_theme.shade,
			userSelect: 'none',
			fontSize: '1rem',
			lineHeight: '1.6',
		},

		Block: {
			flex: {
				grow: 1,
			},
			minWidth: 0,
		},

		Block_comment: {
			flex: {
				shrink: 0,
			},
			alignSelf: 'center',
		},
	} )

}
