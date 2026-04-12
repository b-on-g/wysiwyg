namespace $.$$ {

	$mol_test({

		'page_land returns null when page_land_link is empty'() {

			const history = new $bog_wysiwyg_history()
			history.page_land_link = () => ''
			$mol_assert_equal( history.page_land(), null )
		},

		'page_data returns null when page_land is null'() {

			const history = new $bog_wysiwyg_history()
			history.page_land_link = () => ''
			$mol_assert_equal( history.page_data(), null )
		},

		'version_links returns empty array when no baza'() {

			const history = new $bog_wysiwyg_history()
			history.page_land_link = () => ''
			$mol_assert_like( history.version_links(), [] )
		},

		'version_rows returns empty array when no baza'() {

			const history = new $bog_wysiwyg_history()
			history.page_land_link = () => ''
			$mol_assert_like( history.version_rows(), [] )
		},

		'version_active always returns false'() {

			const history = new $bog_wysiwyg_history()
			$mol_assert_equal( history.version_active( 'some_link' ), false )
			$mol_assert_equal( history.version_active( '' ), false )
		},

		'save_version without event returns null'() {

			const history = new $bog_wysiwyg_history()
			$mol_assert_equal( history.save_version(), null )
		},

		'version_click without event returns null'() {

			const history = new $bog_wysiwyg_history()
			$mol_assert_equal( history.version_click( 'some_link' ), null )
		},

	})

}
