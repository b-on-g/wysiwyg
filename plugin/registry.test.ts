namespace $.$$ {

	$mol_test({

		'register adds plugin to registry'() {

			const registry = $bog_wysiwyg_plugin_registry
			const before = registry.all().length

			registry.register({
				id: '_test_plugin_1',
				title: 'Test Plugin',
			})

			$mol_assert_equal( registry.all().length, before + 1 )

			// cleanup
			registry.plugins.delete( '_test_plugin_1' )
		},

		'all() returns all registered plugins'() {

			const registry = $bog_wysiwyg_plugin_registry

			registry.register({ id: '_test_a', title: 'A' })
			registry.register({ id: '_test_b', title: 'B' })

			const all = registry.all()
			const ids = all.map( p => p.id )

			$mol_assert_ok( ids.includes( '_test_a' ) )
			$mol_assert_ok( ids.includes( '_test_b' ) )

			// cleanup
			registry.plugins.delete( '_test_a' )
			registry.plugins.delete( '_test_b' )
		},

		'get() returns plugin by id'() {

			const registry = $bog_wysiwyg_plugin_registry

			registry.register({ id: '_test_get', title: 'Get Test' })

			const plugin = registry.get( '_test_get' )
			$mol_assert_ok( plugin !== null )
			$mol_assert_equal( plugin!.id, '_test_get' )
			$mol_assert_equal( plugin!.title, 'Get Test' )

			// cleanup
			registry.plugins.delete( '_test_get' )
		},

		'get() returns null for non-existent plugin'() {

			const registry = $bog_wysiwyg_plugin_registry
			$mol_assert_equal( registry.get( '_nonexistent_xyz' ), null )
		},

		'commands() includes plugins from registry'() {

			const registry = $bog_wysiwyg_plugin_registry

			registry.register({ id: '_test_menu', title: 'Menu Test' })

			const menu = new $bog_wysiwyg_menu()
			const cmds = menu.commands()
			const ids = cmds.map( c => c.id )

			$mol_assert_ok( ids.includes( '_test_menu' ) )

			// cleanup
			registry.plugins.delete( '_test_menu' )
		},

		'apply_menu_command calls plugin on_select'() {

			const registry = $bog_wysiwyg_plugin_registry

			let called_with_id = ''
			registry.register({
				id: '_test_select',
				title: 'Select Test',
				on_select: ( editor, block_id ) => {
					called_with_id = block_id
				},
			})

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			editor.apply_menu_command( '_test_select' )

			$mol_assert_equal( called_with_id, 'b1' )

			// cleanup
			registry.plugins.delete( '_test_select' )
		},

		'apply_menu_command for plugin without on_select sets type'() {

			const registry = $bog_wysiwyg_plugin_registry

			registry.register({
				id: '_test_noop',
				title: 'Noop Test',
			})

			const editor = new $bog_wysiwyg()
			editor.active_block_id( 'b1' )
			editor.block_ids( [ 'b1' ] )
			editor.focus_block = () => {}

			editor.apply_menu_command( '_test_noop' )

			$mol_assert_equal( editor.block_type( 'b1' ), '_test_noop' )

			// cleanup
			registry.plugins.delete( '_test_noop' )
		},

	})

}
