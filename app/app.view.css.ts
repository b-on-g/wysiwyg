namespace $ {

	$mol_style_define( $bog_wysiwyg_app, {

		Layout: {
			flex: {
				direction: 'row',
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			alignItems: 'stretch',
			overflow: 'hidden',
		},

		Registry_panel: {
			flex: {
				direction: 'column',
				shrink: 0,
			},
			minWidth: '12rem',
			maxWidth: '16rem',
			gap: '0.25rem',
			padding: {
				top: '0.5rem',
				bottom: '0.5rem',
				left: '0.5rem',
				right: '0.5rem',
			},
			overflow: {
				x: 'hidden',
				y: 'auto',
			},
		},

		Registry_head: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
				shrink: 0,
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			minWidth: 0,
			gap: '0.25rem',
		},

		Registry_title: {
			font: {
				weight: 'bold',
			},
			minWidth: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		},

		Registry_list: {
			minWidth: 0,
			maxWidth: '100%',
		},

		Registry_item: {
			textAlign: 'left',
		},

		/** $bog_ui_sidebar sizes itself by content — cap it so long titles cannot widen the page */
		Sidebar: {
			flex: {
				shrink: 0,
			},
			minWidth: 0,
			maxWidth: '16rem',
		},

		Sidebar_head: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
				shrink: 0,
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			minWidth: 0,
			gap: '0.25rem',
		},

		Sidebar_title: {
			font: {
				weight: 'bold',
			},
			minWidth: 0,
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		},

		Page_item: {
			textAlign: 'left',
		},

		Main: {
			flex: {
				direction: 'column',
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			width: '0px',
			/** Keeps a long word inside the column instead of pushing over the sidebar */
			overflow: {
				x: 'hidden',
				y: 'auto',
			},
		},

		Editor: {
			flex: {
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
		},

		Graph_panel: {
			flex: {
				direction: 'column',
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			padding: {
				top: '1rem',
				bottom: '1rem',
				left: '1rem',
				right: '1rem',
			},
			overflow: 'hidden',
		},

		Profile_panel: {
			flex: {
				direction: 'column',
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			maxWidth: '32rem',
			padding: {
				top: '1rem',
				bottom: '1rem',
				left: '1rem',
				right: '1rem',
			},
			overflow: {
				x: 'hidden',
				y: 'auto',
			},
		},

		Permissions_panel: {
			flex: {
				direction: 'column',
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			minHeight: 0,
			maxWidth: '32rem',
			gap: '0.5rem',
			padding: {
				top: '1rem',
				bottom: '1rem',
				left: '1rem',
				right: '1rem',
			},
			overflow: {
				x: 'hidden',
				y: 'auto',
			},
		},

		Permissions_head: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
				shrink: 0,
			},
			justifyContent: 'space-between',
			alignItems: 'center',
			minWidth: 0,
			gap: '0.5rem',
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

		Permissions_members: {
			minWidth: 0,
			maxWidth: '100%',
		},

		Permissions_member: {
			flex: {
				direction: 'row',
				wrap: 'wrap',
			},
			alignItems: 'center',
			minWidth: 0,
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
				grow: 1,
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
			minWidth: 0,
			gap: '0.5rem',
			alignItems: 'center',
			margin: {
				top: '0.5rem',
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
				shrink: 1,
			},
			minWidth: '8rem',
		},

		'@media': {
			'(max-width: 640px)': {

				Head: {
					minHeight: '3rem',
					padding: {
						top: '0.5rem',
						bottom: '0.5rem',
						left: '0.5rem',
						right: '0.5rem',
					},
				},

				/** Panels stack instead of splitting the screen horizontally */
				Layout: {
					flex: {
						direction: 'column',
					},
				},

				Registry_panel: {
					width: '100%',
					minWidth: 0,
					maxWidth: '100%',
					maxHeight: '9rem',
					border: {
						bottom: {
							width: '1px',
							style: 'solid',
							color: $mol_theme.line,
						},
					},
				},

				Sidebar: {
					width: '100%',
					minWidth: 0,
					maxWidth: '100%',
					maxHeight: '10rem',
					border: {
						bottom: {
							width: '1px',
							style: 'solid',
							color: $mol_theme.line,
						},
					},
				},

				Main: {
					width: '100%',
				},

				Graph_panel: {
					width: '100%',
					padding: {
						top: '0.5rem',
						bottom: '0.5rem',
						left: '0.5rem',
						right: '0.5rem',
					},
				},

				Profile_panel: {
					width: '100%',
					maxWidth: '100%',
					padding: {
						top: '0.75rem',
						bottom: '0.75rem',
						left: '0.75rem',
						right: '0.75rem',
					},
				},

				Permissions_panel: {
					width: '100%',
					maxWidth: '100%',
					padding: {
						top: '0.75rem',
						bottom: '0.75rem',
						left: '0.75rem',
						right: '0.75rem',
					},
				},

				/** Link field, role select and button each take a full row */
				Permissions_add: {
					flex: {
						direction: 'column',
					},
					alignItems: 'stretch',
				},

				Permissions_add_input: {
					minWidth: 0,
				},

			},
		},

	} )

	$mol_style_define( $bog_wysiwyg_app_registry, {

		flex: {
			direction: 'row',
			shrink: 0,
		},
		alignItems: 'center',
		minWidth: 0,
		maxWidth: '100%',
		border: {
			radius: $mol_gap.round,
		},

		Title_nav: {
			display: 'block',
			flex: {
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			textAlign: 'left',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',

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
			shrink: 0,
		},
		alignItems: 'center',
		minWidth: 0,
		maxWidth: '100%',
		border: {
			radius: $mol_gap.round,
		},

		Title_nav: {
			display: 'block',
			flex: {
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
			textAlign: 'left',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',

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

		Rename_trigger: {
			opacity: 0,
			transition: 'opacity 0.15s',
			flex: {
				shrink: 0,
			},

			':focus-visible': {
				opacity: 1,
			},
		},

		Title_input: {
			flex: {
				grow: 1,
				shrink: 1,
			},
			minWidth: 0,
		},

		':hover': {
			Rename_trigger: {
				opacity: 1,
			},
		},

		':focus-within': {
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

		'@media': {
			'(max-width: 640px)': {

				/** No hover on touch — the rename pencil has to stay visible */
				Rename_trigger: {
					opacity: 1,
				},

			},
		},

	} )

}
