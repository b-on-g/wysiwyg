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

		Sidebar_head: {
			flex: {
				direction: 'row',
			},
			justifyContent: 'space-between',
			alignItems: 'center',
		},

		Sidebar_title: {
			font: {
				weight: 'bold',
			},
		},

		Page_item: {
			textAlign: 'left',
		},

		Main: {
			flex: {
				direction: 'column',
				grow: 1,
			},
			minWidth: 0,
			width: '0',
			overflow: {
				y: 'auto',
			},
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
