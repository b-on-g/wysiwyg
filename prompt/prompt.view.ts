namespace $.$$ {

	export class $bog_wysiwyg_prompt extends $.$bog_wysiwyg_prompt {

		pos_y_str() {
			return this.pos_y() + 'px'
		}

		pos_x_str() {
			return this.pos_x() + 'px'
		}

		content() {
			const rows = [ this.Label(), this.Row() ] as $mol_view[]
			if( this.file_shown() ) rows.push( this.Open() )
			return rows
		}

	}

}
