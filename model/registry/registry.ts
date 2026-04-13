namespace $.$$ {
	/** A registry — dict with Title + list of page links. One land = one registry. */
	export class $bog_wysiwyg_model_registry extends $giper_baza_dict.with({
		Title: $giper_baza_atom_text,
		Pages: $giper_baza_list_link,
	}) {}
}
