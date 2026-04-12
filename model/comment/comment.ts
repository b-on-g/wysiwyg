namespace $.$$ {
	/** A single comment entry. Stored as a pawn inside the comment land. */
	export class $bog_wysiwyg_model_comment extends $giper_baza_dict.with({
		Text: $giper_baza_atom_text,
		Author: $giper_baza_atom_text,
		Time: $giper_baza_atom_real,
	}) {}
}
