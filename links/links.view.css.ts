namespace $ {

	$mol_style_define( $bog_wysiwyg_links, {

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
		margin: {
			top: $mol_gap.block,
		},
		gap: $mol_gap.text,

		Header: {
			font: {
				weight: 'bold',
				size: '0.875rem',
			},
			color: $mol_theme.shade,
			padding: {
				left: $mol_gap.text,
				right: $mol_gap.text,
			},
		},

		Link: {
			padding: {
				top: $mol_gap.text,
				bottom: $mol_gap.text,
				left: $mol_gap.text,
				right: $mol_gap.text,
			},
			color: $mol_theme.focus,
			cursor: 'pointer',
			border: {
				radius: $mol_gap.round,
			},
		},

	} )

}
