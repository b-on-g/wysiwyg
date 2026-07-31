namespace $ {

	$mol_style_define( $bog_wysiwyg_comment_thread, {
		flex: {
			direction: 'column',
			grow: 1,
			shrink: 1,
		},
		minWidth: 0,
		minHeight: 0,
		gap: '0.5rem',
		padding: {
			top: '0.5rem',
			bottom: '0.5rem',
			left: '0.5rem',
			right: '0.5rem',
		},

		Comments: {
			flex: {
				direction: 'column',
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			gap: '0.5rem',
			overflow: {
				x: 'hidden',
				y: 'auto',
			},
		},

		Comment_row: {
			flex: {
				direction: 'column',
				shrink: 0,
			},
			minWidth: 0,
			padding: {
				top: '0.375rem',
				bottom: '0.375rem',
				left: '0.5rem',
				right: '0.5rem',
			},
			background: {
				color: $mol_theme.hover,
			},
			border: {
				radius: $mol_gap.round,
			},
			gap: '0.25rem',
		},

		Comment_head: {
			flex: {
				direction: 'row',
			},
			alignItems: 'center',
			minWidth: 0,
			gap: '0.375rem',
		},

		Comment_avatar: {
			width: '1.25rem',
			height: '1.25rem',
			flex: {
				shrink: 0,
				grow: 0,
			},
		},

		Comment_author: {
			font: {
				size: '0.75rem',
				weight: 600,
			},
			color: $mol_theme.shade,
			minWidth: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
		},

		Comment_text: {
			font: {
				size: '0.875rem',
			},
			minWidth: 0,
			maxWidth: '100%',
			overflowWrap: 'anywhere',
		},

		Input_row: {
			flex: {
				direction: 'row',
				shrink: 0,
			},
			minWidth: 0,
			gap: '0.25rem',
			alignItems: 'flex-end',
		},

		Input: {
			flex: {
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
		},

		Send: {
			flex: {
				shrink: 0,
			},
		},

		'@media': {
			'(max-width: 640px)': {

				/** Composer stacks so the Send button keeps a full-size tap target */
				Input_row: {
					flex: {
						direction: 'column',
					},
					alignItems: 'stretch',
					gap: '0.375rem',
				},

				Send: {
					justifyContent: 'center',
					padding: {
						top: '0.5rem',
						bottom: '0.5rem',
						left: '0.75rem',
						right: '0.75rem',
					},
				},

			},
		},

	} )

}
