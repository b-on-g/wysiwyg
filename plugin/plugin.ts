namespace $ {

	export interface $bog_wysiwyg_plugin_config {
		/** Unique block type id */
		id: string
		/** Title shown in slash-menu */
		title: string
		/** Renderer — returns $mol_view for the block (optional) */
		render?: ( block: $bog_wysiwyg_block ) => $mol_view | null
		/** Handler when selected from slash-menu */
		on_select?: ( editor: $bog_wysiwyg, block_id: string ) => void
		/** Custom CSS class for the block */
		css_class?: string
	}

}
