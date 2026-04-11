namespace $ {

	$mol_style_define( $bog_wysiwyg_block, {

		display: 'block',
		outline: 'none',
		padding: {
			top: '0.25rem',
			bottom: '0.25rem',
			left: '0.5rem',
			right: '0.5rem',
		},
		minHeight: '1.5em',
		lineHeight: '1.6',
		borderRadius: '0.25rem',
		cursor: 'text',
		position: 'relative',
		overflowWrap: 'break-word',

		':hover': {
			background: {
				color: $mol_theme.hover,
			},
		},

		':focus': {
			outline: 'none',
			background: {
				color: $mol_theme.hover,
			},
		},

		'[bog_wysiwyg_block_empty]': {
			'true': {
				'::before': {
					content: '"Нажми / для выбора блока..."',
					color: $mol_theme.shade,
					pointerEvents: 'none',
					position: 'absolute',
				},
			},
		},

		'[bog_wysiwyg_block_type]': {
			heading: {
				'[bog_wysiwyg_block_level]': {
					'1': {
						font: { size: '2rem', weight: 700 },
						lineHeight: '1.2',
						margin: { top: '1rem' },
					},
					'2': {
						font: { size: '1.5rem', weight: 700 },
						lineHeight: '1.3',
						margin: { top: '0.75rem' },
					},
					'3': {
						font: { size: '1.25rem', weight: 600 },
						lineHeight: '1.4',
						margin: { top: '0.5rem' },
					},
				},
			},
			code: {
				font: { family: 'monospace' },
				background: { color: $mol_theme.card },
				padding: {
					top: '1rem',
					bottom: '1rem',
					left: '1rem',
					right: '1rem',
				},
				borderRadius: '0.5rem',
				whiteSpace: 'pre-wrap',
			},
			quote: {
				border: {
					left: {
						width: '3px',
						style: 'solid',
						color: $mol_theme.focus,
					},
				},
				padding: { left: '1rem' },
				color: $mol_theme.shade,
				font: { style: 'italic' },
			},
			divider: {
				border: {
					top: {
						width: '1px',
						style: 'solid',
						color: $mol_theme.line,
					},
				},
				minHeight: 0,
				padding: {
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
				},
				margin: { top: '0.5rem', bottom: '0.5rem' },
				pointerEvents: 'none',
			},
		},

	} )

}
