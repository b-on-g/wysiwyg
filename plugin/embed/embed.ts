namespace $ {

	$bog_wysiwyg_plugin_registry.register({
		id: 'embed',
		title: '🔗 Ссылка',
		on_select: ( editor, block_id ) => {
			// The address is asked for in the editor's own panel. A native `prompt()` freezes the
			// renderer, and a frozen tab answers neither the user nor the debug protocol.
			( editor as $.$$.$bog_wysiwyg ).link_prompt_open( block_id, 'embed' )
		},
	})

}
