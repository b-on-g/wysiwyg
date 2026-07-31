namespace $ {

	/**
	 * Draft of a block produced from clipboard content.
	 * Fields map one to one onto $bog_wysiwyg_model_block: Type, Level, Content.
	 */
	export type $bog_wysiwyg_paste_draft = {
		type: string
		level?: number
		content: string
	}

	/** Minimal clipboard surface needed to sniff the format. A real DataTransfer satisfies it. */
	export type $bog_wysiwyg_paste_data = Pick< DataTransfer, 'getData' >

	/** What the clipboard holds. */
	export type $bog_wysiwyg_paste_kind = 'html' | 'markdown' | 'text'

	/**
	 * Clipboard to blocks. Pure functions, no DOM editor and no storage.
	 * Inline markup in `content` is limited to what the block renderer understands:
	 * b, i, u, s, code, a[href], br, img[src].
	 */
	export class $bog_wysiwyg_paste {

		/** Sniffs the clipboard format. Markdown is guessed from plain text when html is missing or has no semantics. */
		static detect( data: $bog_wysiwyg_paste_data ): $bog_wysiwyg_paste_kind {

			const html = paste_get( data, 'text/html' )
			if( html.trim() && paste_rich( html ) ) return 'html'

			const text = paste_get( data, 'text/plain' )
			return paste_markdownish( text ) ? 'markdown' : 'text'
		}

		/** Sniffs the format and parses with the matching parser. */
		static from_data( data: $bog_wysiwyg_paste_data ): $bog_wysiwyg_paste_draft[] {
			switch( this.detect( data ) ) {
				case 'html': return this.from_html( paste_get( data, 'text/html' ) )
				case 'markdown': return this.from_markdown( paste_get( data, 'text/plain' ) )
				default: return this.from_text( paste_get( data, 'text/plain' ) )
			}
		}

		/** Parses clipboard html into block drafts, dropping editor junk. */
		static from_html( html: string ): $bog_wysiwyg_paste_draft[] {

			if( !html.trim() ) return []

			const doc = $mol_dom_parse( html, 'text/html' )
			const drafts: $bog_wysiwyg_paste_draft[] = []
			paste_walk( doc.body, drafts )

			return drafts
		}

		/** Parses markdown source into block drafts. */
		static from_markdown( md: string ): $bog_wysiwyg_paste_draft[] {

			const drafts: $bog_wysiwyg_paste_draft[] = []
			const lines = md.replace( /\r\n?/g, '\n' ).split( '\n' )

			let i = 0
			while( i < lines.length ) {

				const line = lines[ i ]
				const trimmed = line.trim()

				if( !trimmed ) { i++; continue }

				const fence = /^(`{3,}|~{3,})\s*([\w+#.-]*)/.exec( trimmed )
				if( fence ) {
					const marker = fence[ 1 ][ 0 ]
					const lang = paste_lang_clean( fence[ 2 ] )
					const body: string[] = []
					i++
					while( i < lines.length && !new RegExp( '^\\s*\\' + marker + '{3,}\\s*$' ).test( lines[ i ] ) ) {
						body.push( lines[ i ] )
						i++
					}
					if( i < lines.length ) i++
					drafts.push( paste_code( body.join( '\n' ), lang ) )
					continue
				}

				const heading = /^(#{1,6})\s+(.*)$/.exec( trimmed )
				if( heading ) {
					const content = paste_md_inline( heading[ 2 ].replace( /\s+#+\s*$/, '' ) )
					if( content ) drafts.push( { type: 'heading', level: Math.min( 3, heading[ 1 ].length ), content } )
					i++
					continue
				}

				if( /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test( trimmed ) ) {
					drafts.push( { type: 'divider', content: '' } )
					i++
					continue
				}

				if( trimmed.startsWith( '>' ) ) {
					const quote: string[] = []
					while( i < lines.length && lines[ i ].trim().startsWith( '>' ) ) {
						quote.push( lines[ i ].trim().replace( /^>\s?/, '' ) )
						i++
					}
					const content = paste_md_inline( quote.join( '\n' ) )
					if( content ) drafts.push( { type: 'quote', content } )
					continue
				}

				if( paste_md_item.test( line ) ) {
					const items: string[] = []
					while( i < lines.length ) {
						const item = paste_md_item.exec( lines[ i ] )
						if( item ) { items.push( item[ 1 ] ); i++; continue }
						if( items.length && /^\s+\S/.test( lines[ i ] ) ) {
							items[ items.length - 1 ] += ' ' + lines[ i ].trim()
							i++
							continue
						}
						break
					}
					for( const item of items ) {
						const content = paste_md_inline( item )
						if( content ) drafts.push( { type: 'list', content } )
					}
					continue
				}

				if( /^\|.*\|$/.test( trimmed ) ) {
					while( i < lines.length && /^\s*\|.*\|\s*$/.test( lines[ i ] ) ) {
						const cells = lines[ i ].trim().replace( /^\|/, '' ).replace( /\|$/, '' ).split( '|' ).map( cell => cell.trim() )
						const ruler = cells.length > 0 && cells.every( cell => /^:?-{2,}:?$/.test( cell ) )
						if( !ruler ) {
							const content = cells.map( cell => paste_md_inline( cell ) ).filter( Boolean ).join( ' | ' )
							if( content ) drafts.push( { type: 'paragraph', content } )
						}
						i++
					}
					continue
				}

				const image = paste_md_image.exec( trimmed )
				if( image ) {
					const draft = paste_image_draft( paste_md_url( image[ 2 ] ), image[ 1 ] )
					if( draft ) drafts.push( draft )
					i++
					continue
				}

				const para: string[] = []
				while( i < lines.length && lines[ i ].trim() && !paste_md_break( lines[ i ] ) ) {
					para.push( lines[ i ] )
					i++
				}
				if( !para.length ) { i++; continue }
				const content = paste_md_inline( para.join( '\n' ) )
				if( content ) drafts.push( { type: 'paragraph', content } )
			}

			return drafts
		}

		/** Splits plain text into paragraphs by blank lines, keeping line breaks. */
		static from_text( text: string ): $bog_wysiwyg_paste_draft[] {

			return text
				.replace( /\r\n?/g, '\n' )
				.split( /\n[ \t]*\n+/ )
				.map( chunk => paste_escape( chunk.replace( /\u00A0/g, ' ' ) ).trim().replace( /\n/g, '<br>' ) )
				.filter( Boolean )
				.map( content => ( { type: 'paragraph', content } ) )
		}

	}

	const paste_md_item = /^\s{0,8}(?:[-*+]|\d+[.)])\s+(.*)$/

	/** Url part of a markdown link. Allows one level of nested parens, as in wiki links. */
	const paste_md_link_url = '((?:[^\\s()]|\\([^()]*\\))+)(?:\\s+["\'][^"\']*["\'])?\\s*'

	const paste_md_image = new RegExp( '^!\\[([^\\]]*)\\]\\(\\s*' + paste_md_link_url + '\\)$' )

	function paste_md_break( line: string ) {
		const trimmed = line.trim()
		if( /^(`{3,}|~{3,})/.test( trimmed ) ) return true
		if( /^#{1,6}\s/.test( trimmed ) ) return true
		if( /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test( trimmed ) ) return true
		if( trimmed.startsWith( '>' ) ) return true
		if( paste_md_item.test( line ) ) return true
		if( /^\|.*\|$/.test( trimmed ) ) return true
		if( paste_md_image.test( trimmed ) ) return true
		return false
	}

	function paste_get( data: $bog_wysiwyg_paste_data, type: string ) {
		return data.getData( type ) ?? ''
	}

	/** Elements that on their own prove the html is worth parsing as html. */
	const paste_rich_query = 'h1,h2,h3,h4,h5,h6,p,ul,ol,li,blockquote,pre,table,img,hr,a,code'

	/** True when html carries structure or emphasis worth keeping. */
	function paste_rich( html: string ) {

		const doc = $mol_dom_parse( html, 'text/html' )
		if( doc.body.querySelector( paste_rich_query ) ) return true

		for( const el of Array.from( doc.body.querySelectorAll( 'b,strong,i,em,u,s,strike,del,span,font' ) ) ) {
			if( paste_marks( el, el.tagName.toLowerCase() ).length ) return true
		}

		return false
	}

	const paste_md_signs = [
		/^\s{0,3}#{1,6}\s+\S/m,
		/^\s{0,3}(?:[-*+]|\d+[.)])\s+\S/m,
		/^\s{0,3}(?:`{3,}|~{3,})/m,
		/^\s{0,3}>\s?\S/m,
		/^\s{0,3}(?:\*\s*){3,}$|^\s{0,3}(?:-\s*){3,}$|^\s{0,3}(?:_\s*){3,}$/m,
		/!?\[[^\]\n]+\]\([^)\s]+\)/,
		/\*\*[^*\n]+\*\*/,
		/~~[^~\n]+~~/,
		/(?:^|[^`])`[^`\n]+`/,
		/^\s*\|.+\|\s*$/m,
	]

	function paste_markdownish( text: string ) {
		if( !text.trim() ) return false
		return paste_md_signs.some( sign => sign.test( text ) )
	}

	const paste_blocks = new Set( [
		'address', 'article', 'aside', 'blockquote', 'body', 'dd', 'div', 'dl', 'dt',
		'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4',
		'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section',
		'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
	] )

	const paste_drops = new Set( [
		'audio', 'base', 'button', 'canvas', 'col', 'colgroup', 'embed', 'head',
		'iframe', 'input', 'link', 'math', 'meta', 'noscript', 'object', 'option',
		'script', 'select', 'source', 'style', 'svg', 'template', 'textarea',
		'title', 'track', 'video', 'xml',
	] )

	const paste_block_query = 'h1,h2,h3,h4,h5,h6,p,div,ul,ol,li,blockquote,pre,hr,table,tr,td,th,img,'
		+ 'section,article,figure,dl,dd,dt,header,footer,main,nav,aside'

	/**
	 * Namespaced office tags are not listed here on purpose: `o:p` is empty filler that
	 * unwraps to nothing, while `w:sdt` wraps real text that must survive.
	 */
	function paste_skip( el: Element ) {

		const tag = el.tagName.toLowerCase()
		if( paste_drops.has( tag ) ) return true

		const style = ( el.getAttribute( 'style' ) ?? '' ).toLowerCase()
		if( style.includes( 'mso-list:ignore' ) ) return true
		if( /display\s*:\s*none/.test( style ) ) return true

		return false
	}

	function paste_walk( parent: Node, out: $bog_wysiwyg_paste_draft[] ) {

		let buf = ''

		const flush = () => {
			const content = paste_tidy( buf )
			buf = ''
			if( content ) out.push( { type: 'paragraph', content } )
		}

		for( const node of Array.from( parent.childNodes ) ) {

			if( node.nodeType === 3 ) {
				buf += paste_escape( paste_plain_text( node.textContent ?? '' ) )
				continue
			}
			if( node.nodeType !== 1 ) continue

			const el = node as Element
			if( paste_skip( el ) ) continue

			const tag = el.tagName.toLowerCase()

			if( tag === 'br' ) { buf += '<br>'; continue }

			if( tag === 'img' ) {
				flush()
				const draft = paste_image_draft( el.getAttribute( 'src' ) ?? '', el.getAttribute( 'alt' ) ?? '' )
				if( draft ) out.push( draft )
				continue
			}

			if( !paste_blocks.has( tag ) ) {
				if( paste_has_block( el ) ) { flush(); paste_walk( el, out ); continue }
				buf += paste_inline_el( el )
				continue
			}

			flush()
			paste_emit( el, tag, out )
		}

		flush()
	}

	function paste_has_block( el: Element ) {
		return !!el.querySelector( paste_block_query )
	}

	function paste_emit( el: Element, tag: string, out: $bog_wysiwyg_paste_draft[] ) {

		if( /^h[1-6]$/.test( tag ) ) {
			const content = paste_tidy( paste_inline_nodes( el ) )
			if( content ) out.push( { type: 'heading', level: Math.min( 3, Number( tag[ 1 ] ) ), content } )
			paste_images( el, out )
			return
		}

		if( tag === 'hr' ) {
			out.push( { type: 'divider', content: '' } )
			return
		}

		if( tag === 'pre' ) {
			const inner = el.querySelector( 'code' )
			const lang = paste_lang( el ) ?? ( inner ? paste_lang( inner ) : null )
			out.push( paste_code( ( el.textContent ?? '' ).replace( /\u00A0/g, ' ' ).replace( /\r\n?/g, '\n' ), lang ) )
			return
		}

		if( tag === 'ul' || tag === 'ol' ) {
			paste_list( el, out )
			return
		}

		if( tag === 'blockquote' ) {
			const parts: string[] = []
			paste_quote_parts( el, parts )
			const content = parts.join( '<br>' )
			if( content ) out.push( { type: 'quote', content } )
			paste_images( el, out )
			return
		}

		if( tag === 'table' ) {
			paste_table( el, out )
			return
		}

		if( tag === 'p' && paste_word_item( el ) ) {
			const content = paste_tidy( paste_inline_nodes( el ) ).replace( /^(?:[•·▪◦‣§*]|\d+[.)]|[a-z][.)])\s*/i, '' )
			if( content ) out.push( { type: 'list', content } )
			paste_images( el, out )
			return
		}

		paste_walk( el, out )
	}

	/** Word marks list items with a MsoListParagraph class or an mso-list style. */
	function paste_word_item( el: Element ) {
		const cls = el.getAttribute( 'class' ) ?? ''
		if( /mso-?list/i.test( cls ) ) return true
		return /mso-list\s*:/i.test( el.getAttribute( 'style' ) ?? '' )
	}

	function paste_list( el: Element, out: $bog_wysiwyg_paste_draft[] ) {

		for( const node of Array.from( el.children ) ) {

			const tag = node.tagName.toLowerCase()

			if( tag === 'ul' || tag === 'ol' ) { paste_list( node, out ); continue }
			if( tag !== 'li' ) continue
			if( paste_skip( node ) ) continue

			const nested: Element[] = []
			const images: Element[] = []
			let buf = ''

			const gather = ( parent: Node ) => {
				for( const child of Array.from( parent.childNodes ) ) {

					if( child.nodeType === 3 ) {
						buf += paste_escape( paste_plain_text( child.textContent ?? '' ) )
						continue
					}
					if( child.nodeType !== 1 ) continue

					const sub = child as Element
					if( paste_skip( sub ) ) continue

					const sub_tag = sub.tagName.toLowerCase()
					if( sub_tag === 'ul' || sub_tag === 'ol' ) { nested.push( sub ); continue }
					if( sub_tag === 'img' ) { images.push( sub ); continue }
					if( sub_tag === 'br' ) { buf += '<br>'; continue }

					if( paste_blocks.has( sub_tag ) ) {
						if( buf.trim() ) buf += '<br>'
						gather( sub )
						continue
					}

					if( paste_has_block( sub ) ) { gather( sub ); continue }
					buf += paste_inline_el( sub )
				}
			}

			gather( node )

			const content = paste_tidy( buf )
			if( content ) out.push( { type: 'list', content } )

			for( const image of images ) {
				const draft = paste_image_draft( image.getAttribute( 'src' ) ?? '', image.getAttribute( 'alt' ) ?? '' )
				if( draft ) out.push( draft )
			}

			for( const sub of nested ) paste_list( sub, out )
		}
	}

	function paste_quote_parts( parent: Node, parts: string[] ) {

		let buf = ''

		const flush = () => {
			const content = paste_tidy( buf )
			buf = ''
			if( content ) parts.push( content )
		}

		for( const node of Array.from( parent.childNodes ) ) {

			if( node.nodeType === 3 ) {
				buf += paste_escape( paste_plain_text( node.textContent ?? '' ) )
				continue
			}
			if( node.nodeType !== 1 ) continue

			const el = node as Element
			if( paste_skip( el ) ) continue

			const tag = el.tagName.toLowerCase()
			if( tag === 'img' ) continue
			if( tag === 'br' ) { buf += '<br>'; continue }

			if( paste_blocks.has( tag ) || paste_has_block( el ) ) {
				flush()
				paste_quote_parts( el, parts )
				continue
			}

			buf += paste_inline_el( el )
		}

		flush()
	}

	function paste_table( el: Element, out: $bog_wysiwyg_paste_draft[] ) {

		for( const row of Array.from( el.querySelectorAll( 'tr' ) ) ) {

			const cells: string[] = []
			for( const cell of Array.from( row.children ) ) {
				const tag = cell.tagName.toLowerCase()
				if( tag !== 'td' && tag !== 'th' ) continue
				cells.push( paste_tidy( paste_inline_nodes( cell ) ) )
			}

			const content = cells.filter( Boolean ).join( ' | ' )
			if( content ) out.push( { type: 'paragraph', content } )
		}

		paste_images( el, out )
	}

	function paste_images( el: Element, out: $bog_wysiwyg_paste_draft[] ) {
		for( const image of Array.from( el.querySelectorAll( 'img' ) ) ) {
			const draft = paste_image_draft( image.getAttribute( 'src' ) ?? '', image.getAttribute( 'alt' ) ?? '' )
			if( draft ) out.push( draft )
		}
	}

	function paste_inline_nodes( parent: Node ) {

		let out = ''

		for( const node of Array.from( parent.childNodes ) ) {

			if( node.nodeType === 3 ) {
				out += paste_escape( paste_plain_text( node.textContent ?? '' ) )
				continue
			}
			if( node.nodeType !== 1 ) continue

			const el = node as Element
			if( paste_skip( el ) ) continue

			out += paste_inline_el( el )
		}

		return out
	}

	function paste_inline_el( el: Element ): string {

		const tag = el.tagName.toLowerCase()

		if( tag === 'br' ) return '<br>'
		if( tag === 'img' ) return ''

		const inner = paste_inline_nodes( el )
		if( inner === '' ) return ''
		if( !inner.trim() ) return inner

		if( tag === 'a' ) {
			const href = paste_href( el.getAttribute( 'href' ) ?? '' )
			return href ? '<a href="' + paste_attr( href ) + '">' + inner + '</a>' : inner
		}

		let out = inner
		const marks = paste_marks( el, tag ).filter( mark => mark !== 'u' || !paste_wraps_link( inner ) )
		for( let i = marks.length - 1; i >= 0; i-- ) out = '<' + marks[ i ] + '>' + out + '</' + marks[ i ] + '>'

		return out
	}

	/** Editors underline every link with a wrapper span. The underline is already implied by the link. */
	function paste_wraps_link( inner: string ) {
		return /^<a\b[^>]*>[\s\S]*<\/a>$/.test( inner )
	}

	/**
	 * Which of b/i/u/s/code an element stands for, by tag name and by inline style.
	 * Declarations are anchored at a semicolon so that vendor properties like
	 * `mso-bidi-font-weight` do not pass for `font-weight`.
	 */
	function paste_marks( el: Element, tag: string ) {

		const marks: string[] = []
		const style = ( el.getAttribute( 'style' ) ?? '' ).toLowerCase()

		const weight = /(?:^|;)\s*font-weight\s*:\s*([^;]+)/.exec( style )?.[ 1 ]?.trim()
		const bold_style = weight === 'bold' || weight === 'bolder' || ( !!weight && Number( weight ) >= 600 )
		const guid = /^docs-internal-guid/.test( el.getAttribute( 'id' ) ?? '' )
		const bold_tag = ( tag === 'b' || tag === 'strong' ) && !guid && !( !!weight && !bold_style )
		if( bold_tag || bold_style ) marks.push( 'b' )

		const slant = /(?:^|;)\s*font-style\s*:\s*([^;]+)/.exec( style )?.[ 1 ]?.trim()
		const italic_tag = ( tag === 'i' || tag === 'em' ) && slant !== 'normal'
		if( italic_tag || slant === 'italic' || slant === 'oblique' ) marks.push( 'i' )

		const deco = /(?:^|;)\s*text-decoration(?:-line)?\s*:\s*([^;]+)/.exec( style )?.[ 1 ] ?? ''
		if( ( tag === 'u' && !/none/.test( deco ) ) || /underline/.test( deco ) ) marks.push( 'u' )
		const strike_tag = tag === 's' || tag === 'strike' || tag === 'del'
		if( ( strike_tag && !/none/.test( deco ) ) || /line-through/.test( deco ) ) marks.push( 's' )

		if( tag === 'code' || tag === 'tt' || tag === 'kbd' || tag === 'samp' || tag === 'var' ) marks.push( 'code' )

		return marks
	}

	function paste_code( text: string, lang: string | null ): $bog_wysiwyg_paste_draft {
		const body = paste_escape( text.replace( /\n+$/, '' ) )
		return {
			type: 'code',
			content: lang ? '<code class="language-' + lang + '">' + body + '</code>' : body,
		}
	}

	function paste_lang( el: Element ) {
		const found = /(?:^|\s)(?:language|lang)-([\w+#.-]+)/.exec( el.getAttribute( 'class' ) ?? '' )
		return found ? paste_lang_clean( found[ 1 ] ) : null
	}

	function paste_lang_clean( lang: string ) {
		const clean = lang.toLowerCase().replace( /[^a-z0-9+#._-]/g, '' )
		return clean || null
	}

	function paste_image_draft( src: string, alt: string ): $bog_wysiwyg_paste_draft | null {

		const clean = src.trim()
		if( !clean ) return null
		if( /^(?:javascript|vbscript|file):/i.test( clean ) ) return null

		const label = alt.trim()
		return {
			type: 'image',
			content: '<img src="' + paste_attr( clean ) + '"' + ( label ? ' alt="' + paste_attr( label ) + '"' : '' ) + '>',
		}
	}

	function paste_href( href: string ) {
		const clean = href.trim().replace( /\s+/g, ' ' )
		if( !clean ) return null
		if( /^(?:javascript|vbscript|data|file):/i.test( clean ) ) return null
		return clean
	}

	function paste_plain_text( text: string ) {
		return text.replace( /\u00A0/g, ' ' ).replace( /[\t\n\r ]+/g, ' ' )
	}

	function paste_escape( text: string ) {
		return text.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' )
	}

	function paste_attr( text: string ) {
		return paste_escape( text ).replace( /"/g, '&quot;' )
	}

	function paste_tidy( html: string ) {
		return html
			.replace( /[\t\n\r ]+/g, ' ' )
			.replace( /^(?:\s|<br>)+/, '' )
			.replace( /(?:\s|<br>)+$/, '' )
	}

	/** Markdown inline markup to the subset of html the block renderer understands. */
	function paste_md_inline( src: string ) {

		const codes: string[] = []

		let text = paste_escape( src.replace( /\u00A0/g, ' ' ) )

		text = text.replace( /`([^`\n]+)`/g, ( all, body: string ) => {
			codes.push( body.trim() )
			return '\u0000' + ( codes.length - 1 ) + '\u0000'
		} )

		text = text.replace( new RegExp( '!\\[([^\\]]*)\\]\\(\\s*' + paste_md_link_url + '\\)', 'g' ), ( all, alt: string, url: string ) => {
			const href = paste_href( paste_md_url( url ) )
			if( !href ) return alt
			return '<a href="' + paste_attr_escaped( href ) + '">' + ( alt || href ) + '</a>'
		} )

		text = text.replace( new RegExp( '\\[([^\\]]+)\\]\\(\\s*' + paste_md_link_url + '\\)', 'g' ), ( all, label: string, url: string ) => {
			const href = paste_href( paste_md_url( url ) )
			if( !href ) return label
			return '<a href="' + paste_attr_escaped( href ) + '">' + label + '</a>'
		} )

		text = text.replace( /\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<b>$1</b>' )
		text = text.replace( /(?<![\w_])__(?=\S)([\s\S]*?\S)__(?![\w_])/g, '<b>$1</b>' )
		text = text.replace( /~~(?=\S)([\s\S]*?\S)~~/g, '<s>$1</s>' )
		text = text.replace( /(?<![*\w])\*(?=\S)([^*\n]*?\S)\*(?!\*)/g, '<i>$1</i>' )
		text = text.replace( /(?<![\w_])_(?=\S)([^_\n]*?\S)_(?![\w_])/g, '<i>$1</i>' )

		text = text.replace( /\u0000(\d+)\u0000/g, ( all, index: string ) => '<code>' + codes[ Number( index ) ] + '</code>' )

		return text.trim().replace( /\n/g, '<br>' )
	}

	/** Strips angle brackets markdown allows around a url. Runs on already escaped text. */
	function paste_md_url( url: string ) {
		return url.replace( /^&lt;/, '' ).replace( /&gt;$/, '' )
	}

	/** Quotes a value that went through paste_escape already. */
	function paste_attr_escaped( text: string ) {
		return text.replace( /"/g, '&quot;' )
	}

}
