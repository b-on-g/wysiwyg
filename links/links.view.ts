namespace $.$$ {

	export interface $bog_wysiwyg_links_page_info {
		id: string
		title: string
		blocks_html: string[]
	}

	export class $bog_wysiwyg_links extends $.$bog_wysiwyg_links {

		/** Find pages that contain [[page_id]] linking to our page */
		@ $mol_mem
		backlink_pages(): readonly $bog_wysiwyg_links_page_info[] {
			const target = this.page_id()
			if( !target ) return []

			const pattern = '[[' + target + ']]'
			const all = this.all_pages()

			return all.filter( page => {
				if( page.id === target ) return false
				return page.blocks_html.some( html => html.includes( pattern ) )
			} )
		}

		@ $mol_mem
		link_views() {
			return this.backlink_pages().map( page => this.Link( page.id ) )
		}

		link_page_id( id: string ) {
			return id
		}

		link_title( id: string ) {
			const pages = this.backlink_pages()
			const page = pages.find( p => p.id === id )
			return page?.title || id
		}

	}

}
