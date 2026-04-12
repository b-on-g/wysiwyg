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

			'@': {
				'bog_wysiwyg_dragging': {
					'true': {
						opacity: 0.5,
					},
				},
				'bog_wysiwyg_drag_over': {
					'true': {
						'@': {
							'bog_wysiwyg_drag_pos': {
								'before': {
									border: {
										top: {
											width: '2px',
											style: 'solid',
											color: $mol_theme.focus,
										},
									},
								},
								'after': {
									border: {
										bottom: {
											width: '2px',
											style: 'solid',
											color: $mol_theme.focus,
										},
									},
								},
							},
						},
					},
				},
			},
		},

		Drag_handle: {
			flex: {
				shrink: 0,
			},
			width: '1.5rem',
			cursor: 'grab',
			opacity: 0.4,
			transition: 'opacity 0.15s',
			alignSelf: 'center',
			textAlign: 'center',
			color: $mol_theme.shade,
			userSelect: 'none',
			fontSize: '1rem',
			lineHeight: '1.6',

			':active': {
				cursor: 'grabbing',
			},
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

	$mol_style_attach( 'bog_wysiwyg_hover', `
		.bog_wysiwyg_block_row:hover > .bog_wysiwyg_drag_handle,
		.bog_wysiwyg_block_row:hover > .bog_wysiwyg_comment .bog_wysiwyg_comment_comment_button {
			opacity: 1;
		}
	` )

}
