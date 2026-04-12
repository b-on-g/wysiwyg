namespace $ {

	$mol_style_define( $bog_wysiwyg_comment, {

		Comment_button: {
			opacity: 0.4,
			transition: 'opacity 0.15s',
			cursor: 'pointer',
			minWidth: '1.5rem',
			minHeight: '1.5rem',
			padding: {
				top: '0.25rem',
				bottom: '0.25rem',
				left: '0.25rem',
				right: '0.25rem',
			},
		},

		Comment_count: {
			font: {
				size: '0.75rem',
				weight: 600,
			},
			color: $mol_theme.focus,
		},

		Panel: {
			flex: {
				direction: 'column',
			},
			width: '18rem',
			maxWidth: '90vw',
			maxHeight: '24rem',
			background: {
				color: $mol_theme.card,
			},
			border: {
				radius: $mol_gap.round,
			},
			boxShadow: `0 4px 16px 0 ${$mol_theme.shade}`,
		},

		Panel_head: {
			flex: {
				direction: 'row',
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: {
				top: '0.5rem',
				bottom: '0.25rem',
				left: '0.75rem',
				right: '0.25rem',
			},
			border: {
				bottom: {
					width: '1px',
					style: 'solid',
					color: $mol_theme.line,
				},
			},
		},

		Panel_title: {
			font: {
				weight: 600,
			},
		},

		Thread: {
			flex: {
				grow: 1,
			},
			overflow: 'auto',
		},

		'@': {
			'bog_wysiwyg_comment_has_comments': {
				'true': {
					Comment_button: {
						opacity: 1,
						color: $mol_theme.focus,
					},
				},
			},
		},
	} )

}
