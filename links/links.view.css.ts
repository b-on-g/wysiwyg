namespace $ {

	$mol_style_define( $bog_wysiwyg_links, {

		flex: {
			direction: 'column',
			shrink: 0,
		},
		minWidth: 0,
		maxWidth: '100%',
		padding: {
			top: $mol_gap.block,
			bottom: $mol_gap.block,
			left: 0,
			right: 0,
		},
		border: {
			top: {
				width: '1px',
				style: 'solid',
				color: $mol_theme.line,
			},
		},
		gap: '0.125rem',

		':empty': {
			display: 'none',
		},

		Header: {
			font: {
				weight: 'bold',
				size: '0.875rem',
			},
			color: $mol_theme.shade,
			padding: $mol_gap.text,
		},

		Links: {
			flex: {
				direction: 'column',
			},
			minWidth: 0,
			maxWidth: '100%',
			gap: '0.125rem',
		},

		Link: {
			display: 'block',
			minWidth: 0,
			maxWidth: '100%',
			padding: $mol_gap.text,
			color: $mol_theme.focus,
			cursor: 'pointer',
			border: {
				radius: $mol_gap.round,
			},
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',

			':hover': {
				background: {
					color: $mol_theme.hover,
				},
			},

			':focus-visible': {
				outline: 'none',
				box: {
					shadow: [
						{
							inset: true,
							x: 0,
							y: 0,
							blur: 0,
							spread: '2px',
							color: $mol_theme.focus,
						},
					],
				},
			},
		},

		'@media': {
			'(max-width: 640px)': {

				Link: {
					padding: {
						top: '0.625rem',
						bottom: '0.625rem',
						left: '0.5rem',
						right: '0.5rem',
					},
				},

			},
		},

	} )

}
