namespace $.$$ {
	/** A WYSIWYG page. One page = one Land. Contains title + ordered list of blocks. */
	export class $bog_wysiwyg_model_page extends $giper_baza_dict.with({
		Title: $giper_baza_atom_text,
		Blocks: $giper_baza_list_link_to(() => $bog_wysiwyg_model_block),
	}) {}
}
