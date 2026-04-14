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

		Registry_panel: {
			flex: {
				direction: 'column',
				shrink: 0,
			},
			overflow: {
				y: 'auto',
			},
			minWidth: '12rem',
			maxWidth: '16rem',
		},

		Registry_head: {
			flex: {
				direction: 'row',
			},
			justifyContent: 'space-between',
			alignItems: 'center',
		},

		Registry_title: {
			font: {
				weight: 'bold',
			},
		},

		Registry_item: {
			textAlign: 'left',
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

		Permissions_panel: {
			flex: {
				direction: 'column',
				shrink: 0,
			},
			padding: {
				top: '1rem',
				bottom: '1rem',
				left: '1rem',
				right: '1rem',
			},
			minWidth: '16rem',
			maxWidth: '24rem',
			overflow: {
				y: 'auto',
			},
		},

		Permissions_head: {
			flex: {
				direction: 'row',
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			margin: {
				bottom: '0.5rem',
			},
		},

		Permissions_title: {
			font: {
				weight: 'bold',
			},
		},

		Permissions_role: {
			color: $mol_theme.shade,
			font: {
				size: '0.85rem',
			},
		},

		Permissions_member: {
			flex: {
				direction: 'row',
			},
			alignItems: 'center',
			gap: '0.5rem',
			padding: {
				top: '0.25rem',
				bottom: '0.25rem',
				left: 0,
				right: 0,
			},
		},

		Permissions_member_lord: {
			flex: {
				shrink: 1,
			},
			minWidth: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			whiteSpace: 'nowrap',
			font: {
				size: '0.8rem',
				family: 'monospace',
			},
		},

		Permissions_add: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
			},
			gap: '0.5rem',
			alignItems: 'center',
			margin: {
				top: '1rem',
			},
			padding: {
				top: '0.5rem',
				bottom: 0,
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
		},

		Permissions_add_input: {
			flex: {
				grow: 1,
			},
			minWidth: '8rem',
		},

	} )

	$mol_style_define( $bog_wysiwyg_app_registry, {
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

		'@': {
			'bog_wysiwyg_app_registry_active': {
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
