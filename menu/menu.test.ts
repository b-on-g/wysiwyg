namespace $.$$ {

	const locale_en = {
		'$bog_wysiwyg_menu_command_paragraph': 'Text',
		'$bog_wysiwyg_menu_command_heading1': 'Heading 1',
		'$bog_wysiwyg_menu_command_heading2': 'Heading 2',
		'$bog_wysiwyg_menu_command_heading3': 'Heading 3',
		'$bog_wysiwyg_menu_command_code': 'Code',
		'$bog_wysiwyg_menu_command_quote': 'Quote',
		'$bog_wysiwyg_menu_command_list': 'List',
		'$bog_wysiwyg_menu_command_divider': 'Divider',
		'$bog_wysiwyg_menu_command_image': 'Image',
	}

	function menu_make() {
		$mol_locale.texts( 'en', locale_en )
		return new $bog_wysiwyg_menu()
	}

	$mol_test({

		'Menu commands returns builtin commands'() {

			const menu = menu_make()
			const cmds = menu.commands()

			$mol_assert_ok( cmds.length >= 9 )
			$mol_assert_equal( cmds[ 0 ].id, 'paragraph' )
			$mol_assert_equal( cmds[ 1 ].id, 'heading1' )
			$mol_assert_equal( cmds[ 2 ].id, 'heading2' )
			$mol_assert_equal( cmds[ 3 ].id, 'heading3' )
			$mol_assert_equal( cmds[ 4 ].id, 'code' )
			$mol_assert_equal( cmds[ 5 ].id, 'quote' )
			$mol_assert_equal( cmds[ 6 ].id, 'list' )
			$mol_assert_equal( cmds[ 7 ].id, 'divider' )
			$mol_assert_equal( cmds[ 8 ].id, 'image' )
		},

		'Menu option_rows returns views matching commands length'() {

			const menu = menu_make()
			const rows = menu.option_rows()

			$mol_assert_equal( rows.length, menu.commands().length )
		},

		'Menu option_title returns title for known command id'() {

			const menu = menu_make()
			const title = menu.option_title( 'paragraph' )

			$mol_assert_ok( title.length > 0 )
		},

		'Menu option_title returns empty string for unknown id'() {

			const menu = menu_make()
			const title = menu.option_title( 'nonexistent' )

			$mol_assert_equal( title, '' )
		},

		'Menu option_active returns true when index matches'() {

			const menu = menu_make()
			menu.index( 0 )

			const first_id = menu.commands()[ 0 ].id
			$mol_assert_equal( menu.option_active( first_id ), true )
		},

		'Menu option_active returns false for non-matching id'() {

			const menu = menu_make()
			menu.index( 0 )

			$mol_assert_equal( menu.option_active( 'nonexistent' ), false )
		},

		'Menu option_active tracks index changes'() {

			const menu = menu_make()
			menu.index( 2 )

			const cmd = menu.commands()[ 2 ]
			$mol_assert_equal( menu.option_active( cmd.id ), true )
			$mol_assert_equal( menu.option_active( menu.commands()[ 0 ].id ), false )
		},

		'Menu option_click calls picked and hides menu'() {

			const menu = menu_make()
			menu.showed( true )

			let picked_val = ''
			menu.picked = ( next?: string ) => {
				if( next !== undefined ) picked_val = next
				return picked_val
			}

			const event = { type: 'click' } as unknown as Event
			menu.option_click( 'heading1', event )

			$mol_assert_equal( picked_val, 'heading1' )
			$mol_assert_equal( menu.showed(), false )
		},

		'Menu option_click without event returns null'() {

			const menu = menu_make()
			$mol_assert_equal( menu.option_click( 'paragraph' ), null )
		},

		'Menu pos_y_str returns pixel string'() {

			const menu = menu_make()
			menu.pos_y( 200 )
			$mol_assert_equal( menu.pos_y_str(), '200px' )
		},

		'Menu pos_x_str returns pixel string'() {

			const menu = menu_make()
			menu.pos_x( 350 )
			$mol_assert_equal( menu.pos_x_str(), '350px' )
		},

	})

}
