namespace $ {

	$mol_style_define( $bog_wysiwyg_app, {
		Editor: {
			margin: {
				top:'3rem'
			}
			
		},

		Layout: {
			flex: {
				direction: 'row',
				grow: 1,
			},
		},

		Sidebar: {
			flex: {
				direction: 'column',
				shrink: 0,
			},
			width: '14rem',
			overflow: {
				y: 'auto',
				x: 'hidden',
			},
		},

		Sidebar_head: {
			flex: {
				direction: 'row',
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: $mol_gap.block,
		},

		Sidebar_title: {
			font: {
				weight: 'bold',
			},
		},

		Page_list: {
			flex: {
				direction: 'column',
			},
		},

		Page_item: {
			textAlign: 'left',
			padding: {
				top: '0.25rem',
				bottom: '0.25rem',
				left: $mol_gap.text,
				right: $mol_gap.text,
			},
		},

		Main: {
			flex: {
				direction: 'column',
				grow: 1,
			},
			minWidth: 0,
		},

		Graph_panel: {
			flex: {
				grow: 1,
			},
			minWidth: 0,
			minHeight: '400px',
		},

	} )

	$mol_style_define( $bog_wysiwyg_app_page, {
		'@': {
			'bog_wysiwyg_app_page_active': {
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
