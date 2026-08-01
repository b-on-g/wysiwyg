namespace $ {

	$mol_style_define( $bog_wysiwyg, {
		position: 'relative',
		flex: {
			direction: 'column',
			grow: 1,
			shrink: 1,
		},

		/** Readable column: 40rem of text plus 3rem margins on both sides */
		alignSelf: 'center',
		width: '100%',
		minWidth: 0,
		maxWidth: '46rem',
		gap: '1rem',
		padding: {
			top: '2.5rem',
			bottom: '6rem',
			left: '3rem',
			right: '3rem',
		},

		Status: {
			flex: {
				shrink: 0,
			},
			minWidth: 0,
		},

		/** Says out loud what a write refused to store. Click dismisses it. */
		Notice: {
			position: 'fixed',
			zIndex: 100,
			bottom: '1rem',
			left: '1rem',
			right: '1rem',
			margin: {
				left: 'auto',
				right: 'auto',
			},
			maxWidth: '30rem',
			textAlign: 'left',
			justifyContent: 'flex-start',
			borderRadius: '0.5rem',
			padding: '0.75rem',
			color: $mol_theme.text,
			background: {
				color: $mol_theme.focus,
			},

			':not([bog_wysiwyg_notice_showed])': {
				display: 'none',
			},
		},

		Block_list: {
			flex: {
				shrink: 1,
			},
			minWidth: 0,
			maxWidth: '100%',
		},

		Block_row: {
			position: 'relative',
			flex: {
				direction: 'row',
				shrink: 1,
			},
			alignItems: 'flex-start',
			minWidth: 0,
			maxWidth: '100%',
			gap: '0.125rem',

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
				grow: 0,
			},
			width: '1.5rem',
			cursor: 'grab',
			opacity: 0,
			transition: 'opacity 0.15s',
			alignSelf: 'flex-start',
			justifyContent: 'center',
			padding: {
				top: '0.25rem',
				bottom: '0.25rem',
				left: 0,
				right: 0,
			},
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
				shrink: 1,
			},
			minWidth: 0,
			width: '0px',
		},

		Block_comment: {
			flex: {
				shrink: 0,
			},
			alignSelf: 'flex-start',
			padding: {
				top: '0.125rem',
				bottom: 0,
				left: 0,
				right: 0,
			},
		},

		'@media': {
			'(max-width: 640px)': {

				maxWidth: '100%',
				gap: '0.75rem',
				padding: {
					top: '1rem',
					bottom: '4rem',
					left: '0.75rem',
					right: '0.75rem',
				},

				/** No drag&drop on touch — reclaim the gutter for text */
				Drag_handle: {
					display: 'none',
				},

			},
		},

	} )

	/**
	 * Row gutter controls appear on hover of the whole row.
	 * Raw css because the comment button belongs to $bog_wysiwyg_comment and
	 * $mol_style_define on a foreign component would wipe its own styles.
	 */
	$mol_style_attach( 'bog_wysiwyg_hover', `
		[bog_wysiwyg_block_row]:hover [bog_wysiwyg_drag_handle],
		[bog_wysiwyg_block_row]:focus-within [bog_wysiwyg_drag_handle],
		[bog_wysiwyg_block_row]:hover [bog_wysiwyg_comment_comment_button],
		[bog_wysiwyg_block_row]:focus-within [bog_wysiwyg_comment_comment_button] {
			opacity: 1;
		}

		@media ( hover: none ), ( max-width: 640px ) {
			[bog_wysiwyg_drag_handle],
			[bog_wysiwyg_comment_comment_button] {
				opacity: 1;
			}
		}
	` )

}
