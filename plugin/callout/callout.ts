namespace $ {

	$bog_wysiwyg_plugin_registry.register({
		id: 'callout',
		title: '\uD83D\uDCA1 \u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430',
		on_select: ( editor, block_id ) => {
			editor.block_type( block_id, 'callout' )
			editor.block_html( block_id, '' )
		},
	})

}
