namespace $.$$ {

	export class $bog_wysiwyg_comment extends $.$bog_wysiwyg_comment {

		@ $mol_mem
		comment_count_text() {
			const count = this.Thread().comment_count()
			return count > 0 ? String( count ) : ''
		}

		toggle( event?: Event ) {
			if( !event ) return null
			this.panel_open( !this.panel_open() )
			return event
		}

		close( event?: Event ) {
			if( !event ) return null
			this.panel_open( false )
			return event
		}

	}

}
