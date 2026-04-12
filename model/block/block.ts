namespace $.$$ {
	/** A single block in a WYSIWYG page. Stored as a pawn inside the page land. */
	export class $bog_wysiwyg_model_block extends $giper_baza_dict.with({
		Type: $giper_baza_atom_text,
		Level: $giper_baza_atom_real,
		Content: $giper_baza_atom_text,
	}) {}
}
