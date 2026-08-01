namespace $.$$ {

	/**
	 * Exports a page as markdown for an outside platform.
	 * All the serialization lives in the pure `$bog_wysiwyg_export_markdown`,
	 * this component only unwraps Giper Baza data into plain blocks and shows the result.
	 */
	export class $bog_wysiwyg_export extends $.$bog_wysiwyg_export {

		dialect_current(): $bog_wysiwyg_export_dialect {
			const value = this.dialect()
			if( value === 'habr' || value === 'devto' || value === 'telegram' ) return value
			return 'common'
		}

		limit() {
			return $bog_wysiwyg_export_limit( this.dialect_current() )
		}

		@ $mol_mem
		override markdown() {
			return $bog_wysiwyg_export_markdown( this.blocks(), {
				dialect: this.dialect_current(),
				title: this.page_title(),
				tags: this.tags(),
				cover: this.cover(),
				base: this.base_uri(),
				images_apart: this.images_apart(),
				labels: {
					image: this.label_image(),
					images: this.label_images(),
				},
			} )
		}

		@ $mol_mem
		parts(): readonly string[] {
			const markdown = this.markdown()
			const limit = this.limit()
			if( !Number.isFinite( limit ) ) return [ markdown ]
			return $bog_wysiwyg_export_split( markdown, limit )
		}

		/** Index of the shown message, clamped to the currently available parts */
		@ $mol_mem
		override part_current( next?: string ): string {

			if( next !== undefined ) {
				this.part( next )
				return next
			}

			const index = Number( this.part() )
			const count = this.parts().length
			return String( Number.isFinite( index ) && index >= 0 && index < count ? index : 0 )
		}

		@ $mol_mem
		override part_options() {
			const parts = this.parts()
			const res = {} as Record< string, string >
			parts.forEach( ( _, index ) => {
				res[ String( index ) ] = `${ index + 1 } / ${ parts.length }`
			} )
			return res
		}

		@ $mol_mem
		override markdown_shown() {
			const parts = this.parts()
			if( parts.length < 2 ) return this.markdown()
			return parts[ Number( this.part_current() ) ] ?? parts[ 0 ]
		}

		@ $mol_mem
		override note() {
			const total = this.markdown().length
			const parts = this.parts()
			const head = `${ this.note_length() }: ${ total }`
			if( parts.length < 2 ) return head
			return `${ head } · ${ this.note_parts() }: ${ parts.length } × ${ this.limit() }`
		}

		@ $mol_mem
		override bubble_content() {
			return [
				this.Head(),
				this.Note(),
				... this.parts().length > 1 ? [ this.Parts() ] : [],
				this.Body(),
			] as readonly $mol_view_content[]
		}

	}

}
