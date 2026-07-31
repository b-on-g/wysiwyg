namespace $ {

	$mol_style_define( $bog_wysiwyg_history, {

		flex: {
			direction: 'column',
			shrink: 0,
		},
		minWidth: 0,
		maxWidth: '100%',
		padding: {
			top: '0.75rem',
			bottom: '0.75rem',
			left: '0.75rem',
			right: '0.75rem',
		},
		gap: '0.5rem',
		background: {
			color: $mol_theme.card,
		},
		border: {
			radius: $mol_gap.round,
		},

		':not([bog_wysiwyg_history_showed])': {
			display: 'none',
		},

		Save_button: {
			flex: {
				shrink: 0,
			},
			justifyContent: 'center',
			fontWeight: 'bold',
			background: {
				color: $mol_theme.control,
			},
			color: $mol_theme.back,
			border: {
				radius: $mol_gap.round,
			},
		},

		Version_list: {
			flex: {
				direction: 'column',
			},
			minWidth: 0,
			maxWidth: '100%',
			maxHeight: '18rem',
			overflow: {
				x: 'hidden',
				y: 'auto',
			},
			gap: '0.125rem',
		},

		'@media': {
			'(max-width: 640px)': {

				padding: {
					top: '0.5rem',
					bottom: '0.5rem',
					left: '0.5rem',
					right: '0.5rem',
				},

				Version_list: {
					maxHeight: '12rem',
				},

			},
		},

	} )

	$mol_style_define( $bog_wysiwyg_history_version, {

		justifyContent: 'flex-start',
		textAlign: 'left',
		minWidth: 0,
		maxWidth: '100%',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		border: {
			radius: $mol_gap.round,
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

		'@': {
			'bog_wysiwyg_history_version_active': {
				'true': {
					background: {
						color: $mol_theme.hover,
					},
					font: {
						weight: 'bold',
					},
				},
			},
		},

	} )

}
