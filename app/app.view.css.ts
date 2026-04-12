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
			width: '0px',
			overflow: {
				y: 'auto',
			},
		},

		Graph_panel: {
			flex: {
				grow: 1,
			},
			minWidth: 0,
			overflow: 'hidden',
		},

	} )

	$mol_style_define( $bog_wysiwyg_app_page, {
		flex: {
			direction: 'row',
		},
		alignItems: 'center',

		Title_nav: {
			flex: {
				grow: 1,
			},
			textAlign: 'left',
		},

		Rename_trigger: {
			opacity: 0,
			transition: 'opacity 0.15s',
			flex: {
				shrink: 0,
			},
		},

		Title_input: {
			flex: {
				grow: 1,
			},
		},

		':hover': {
			Rename_trigger: {
				opacity: 1,
			},
		},

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
