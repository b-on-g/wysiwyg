namespace $ {

	$mol_style_define( $bog_wysiwyg_comment_thread, {
		flex: {
			direction: 'column',
			grow: 1,
		},
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
			},
			gap: '0.5rem',
			overflow: 'auto',
		},

		Comment_row: {
			flex: {
				direction: 'column',
			},
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
		},

		Comment_text: {
			font: {
				size: '0.875rem',
			},
		},

		Input_row: {
			flex: {
				direction: 'row',
			},
			gap: '0.25rem',
			alignItems: 'flex-end',
		},

		Input: {
			flex: {
				grow: 1,
			},
		},

		Send: {
			flex: {
				shrink: 0,
			},
		},
	} )

}
