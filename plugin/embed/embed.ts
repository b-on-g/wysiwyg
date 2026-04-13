namespace $ {

	$bog_wysiwyg_plugin_registry.register({
		id: 'embed',
		title: '🔗 Ссылка',
		on_select: ( editor, block_id ) => {
			const url = editor.$.$mol_dom_context.prompt( 'URL:' )
			if( !url ) return

			const safe = url.replace( /"/g, '&quot;' ).replace( /</g, '&lt;' )
			let display = url.replace( /^https?:\/\//, '' )
			if( display.length > 60 ) display = display.slice( 0, 57 ) + '...'
			const safe_display = display.replace( /</g, '&lt;' )

			editor.block_type( block_id, 'embed' )
			editor.block_html( block_id,
				'<a href="' + safe + '" target="_blank" rel="noopener">' + safe_display + '</a>'
			)
		},
	})

}
