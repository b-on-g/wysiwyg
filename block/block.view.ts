namespace $ {

	export function $bog_wysiwyg_parse_markdown( text: string ) {

		const blocks: { type: string, content: string, level?: number }[] = []
		const lines = text.split( '\n' )

		let i = 0
		while( i < lines.length ) {
			const line = lines[ i ]

			if( !line.trim() ) { i++; continue }

			if( line.trimStart().startsWith( '```' ) ) {
				const code_lines: string[] = []
				i++
				while( i < lines.length && !lines[ i ].trimStart().startsWith( '```' ) ) {
					code_lines.push( lines[ i ] )
					i++
				}
				if( i < lines.length ) i++
				blocks.push( { type: 'code', content: md_escape_html( code_lines.join( '\n' ) ) } )
				continue
			}

			const heading_match = line.match( /^(#{1,3})\s+(.+)/ )
			if( heading_match ) {
				blocks.push( { type: 'heading', content: md_inline( heading_match[ 2 ] ), level: heading_match[ 1 ].length } )
				i++
				continue
			}

			if( /^[-*_]{3,}\s*$/.test( line.trim() ) ) {
				blocks.push( { type: 'divider', content: '' } )
				i++
				continue
			}

			if( line.trimStart().startsWith( '> ' ) || line.trimStart() === '>' ) {
				const quote_lines: string[] = []
				while( i < lines.length && ( lines[ i ].trimStart().startsWith( '> ' ) || lines[ i ].trimStart() === '>' ) ) {
					quote_lines.push( lines[ i ].replace( /^>\s?/, '' ) )
					i++
				}
				blocks.push( { type: 'quote', content: md_inline( quote_lines.join( '<br>' ) ) } )
				continue
			}

			const para_lines: string[] = []
			while( i < lines.length && lines[ i ].trim()
				&& !lines[ i ].trimStart().startsWith( '```' )
				&& !lines[ i ].match( /^#{1,3}\s/ )
				&& !( /^[-*_]{3,}\s*$/.test( lines[ i ].trim() ) )
				&& !lines[ i ].trimStart().startsWith( '> ' )
			) {
				para_lines.push( lines[ i ] )
				i++
			}
			if( para_lines.length ) {
				blocks.push( { type: 'paragraph', content: md_inline( para_lines.join( '<br>' ) ) } )
			}
		}

		return blocks
	}

	function md_inline( text: string ): string {
		text = text.replace( /\[(.+?)\]\((\S+?)\)/g, '<a href="$2">$1</a>' )
		text = text.replace( /\*\*(.+?)\*\*/g, '<b>$1</b>' )
		text = text.replace( /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>' )
		text = text.replace( /`(.+?)`/g, '<code>$1</code>' )
		text = text.replace( /~~(.+?)~~/g, '<s>$1</s>' )
		return text
	}

	function md_escape_html( text: string ): string {
		return text.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' )
	}

	/** Escape plain text to be safely embedded into HTML */
	export function $bog_wysiwyg_escape_html( text: string ): string {
		return md_escape_html( text )
	}

	/** DOM position (node + offset) for a plain text offset inside a root node */
	export function $bog_wysiwyg_point_at( root: Node, offset: number ): { node: Node, offset: number } {

		const doc = root.ownerDocument ?? ( root as Document )
		const walker = doc.createTreeWalker( root, 4 /* NodeFilter.SHOW_TEXT */ )

		let rest = Math.max( 0, offset )
		let last: Text | null = null
		let node = walker.nextNode() as Text | null

		while( node ) {
			const len = node.data.length
			if( rest <= len ) return { node, offset: rest }
			rest -= len
			last = node
			node = walker.nextNode() as Text | null
		}

		if( last ) return { node: last, offset: last.data.length }
		return { node: root, offset: 0 }
	}

	/** Plain text offset of a DOM position inside a root node. -1 when the position is outside. */
	export function $bog_wysiwyg_offset_of( root: Node, node: Node, offset: number ): number {

		if( root !== node && !root.contains( node ) ) return -1

		const doc = root.ownerDocument ?? ( root as Document )
		const range = doc.createRange()
		range.selectNodeContents( root )
		range.setEnd( node, offset )

		return range.toString().length
	}

	/** Plain text of an HTML fragment */
	export function $bog_wysiwyg_html_text( doc: Document, html: string ): string {
		const box = doc.createElement( 'div' )
		box.innerHTML = html
		return box.textContent ?? ''
	}

	/** Collapsed Range under a viewport point, when the engine is able to tell */
	export function $bog_wysiwyg_caret_from_point( doc: Document, x: number, y: number ): Range | null {

		const legacy = Reflect.get( doc, 'caretRangeFromPoint' )
		if( typeof legacy === 'function' ) return legacy.call( doc, x, y ) ?? null

		const modern = Reflect.get( doc, 'caretPositionFromPoint' )
		if( typeof modern === 'function' ) {
			const pos = modern.call( doc, x, y )
			if( !pos ) return null
			const range = doc.createRange()
			range.setStart( pos.offsetNode, pos.offset )
			range.collapse( true )
			return range
		}

		return null
	}

}

namespace $.$$ {

	const markdown_patterns = [
		{
			// **bold** → <b>bold</b>
			regex: /\*\*(.+?)\*\*/,
			tag: 'b',
		},
		{
			// *italic* → <i>italic</i> — but NOT inside ** sequences
			regex: /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/,
			tag: 'i',
		},
		{
			// `code` → <code>code</code>
			regex: /`(.+?)`/,
			tag: 'code',
		},
		{
			// ~~strike~~ → <s>strike</s>
			regex: /~~(.+?)~~/,
			tag: 's',
		},
	] as const

	const link_pattern = /\[(.+?)\]\((\S+?)\)/

	const wiki_link_pattern = /\[\[([^\]]+)\]\]/

	export class $bog_wysiwyg_block extends $.$bog_wysiwyg_block {

		override minimal_height() {
			return 40
		}

		content_editable() {
			if( this.readonly() ) return 'false'
			return 'true'
		}

		@ $mol_mem
		is_empty() {
			const html = this.html()
			if( this.type() === 'image' && html?.includes( '<img' ) ) return false
			if( this.type() === 'embed' && html?.includes( '<a' ) ) return false
			const plugin = $bog_wysiwyg_plugin_registry.get( this.type() )
			if( plugin?.render && html ) return false
			return !html?.replace( /<[^>]*>/g, '' ).trim()
		}

		override sub() {
			return null as any
		}

		is_image() {
			return this.type() === 'image'
		}

		is_static() {
			if( this.type() === 'image' || this.type() === 'embed' ) return true
			const plugin = $bog_wysiwyg_plugin_registry.get( this.type() )
			return !!plugin?.render
		}

		// === Caret ===

		/** Editable root of this block */
		node_el() {
			return this.dom_node() as HTMLElement
		}

		/** Plain text of the block as it is rendered right now */
		text_content() {
			return this.node_el().textContent ?? ''
		}

		selection() {
			return this.node_el().ownerDocument.defaultView?.getSelection() ?? null
		}

		selection_collapsed() {
			const sel = this.selection()
			return !sel || sel.isCollapsed
		}

		/** Text offset of the caret inside this block. -1 when the caret is elsewhere. */
		caret_offset(): number {
			const sel = this.selection()
			if( !sel || sel.rangeCount === 0 ) return -1
			const focus = sel.focusNode
			if( !focus ) return -1
			return $bog_wysiwyg_offset_of( this.node_el(), focus, sel.focusOffset )
		}

		/** Put a collapsed caret at a plain text offset. Survives innerHTML rewrites. */
		caret_place( offset: number ) {
			const node = this.node_el()
			const sel = this.selection()
			if( !sel ) return
			const point = $bog_wysiwyg_point_at( node, offset )
			const range = node.ownerDocument.createRange()
			range.setStart( point.node, point.offset )
			range.collapse( true )
			sel.removeAllRanges()
			sel.addRange( range )
		}

		/** Focus the block and place the caret at a text offset (end of text by default) */
		focus_at( offset?: number ) {
			const node = this.node_el()
			node.focus()
			const len = ( node.textContent ?? '' ).length
			this.caret_place( offset === undefined ? len : Math.max( 0, Math.min( offset, len ) ) )
		}

		/** HTML of the content before a text offset */
		html_before( offset: number ) {
			const node = this.node_el()
			const doc = node.ownerDocument
			const point = $bog_wysiwyg_point_at( node, offset )
			const range = doc.createRange()
			range.selectNodeContents( node )
			range.setEnd( point.node, point.offset )
			const box = doc.createElement( 'div' )
			box.appendChild( range.cloneContents() )
			return box.innerHTML
		}

		/** HTML of the content after a text offset */
		html_after( offset: number ) {
			const node = this.node_el()
			const doc = node.ownerDocument
			const point = $bog_wysiwyg_point_at( node, offset )
			const range = doc.createRange()
			range.selectNodeContents( node )
			range.setStart( point.node, point.offset )
			const box = doc.createElement( 'div' )
			box.appendChild( range.cloneContents() )
			return box.innerHTML
		}

		/** Drop the selected content when the whole selection lies inside this block */
		delete_range() {
			const node = this.node_el()
			const sel = this.selection()
			if( !sel || sel.isCollapsed || sel.rangeCount === 0 ) return false

			const range = sel.getRangeAt( 0 )
			if( !node.contains( range.startContainer ) || !node.contains( range.endContainer ) ) return false

			const offset = $bog_wysiwyg_offset_of( node, range.startContainer, range.startOffset )
			range.deleteContents()
			this.html( node.innerHTML )
			this.caret_place( offset )

			return true
		}

		/** Bounding box of a text range. Null when the engine gives no layout. */
		range_rect( from: number, to: number ): DOMRect | null {
			const node = this.node_el()
			const doc = node.ownerDocument
			const start = $bog_wysiwyg_point_at( node, from )
			const end = $bog_wysiwyg_point_at( node, to )
			const range = doc.createRange()
			range.setStart( start.node, start.offset )
			range.setEnd( end.node, end.offset )
			if( typeof range.getBoundingClientRect !== 'function' ) return null
			return range.getBoundingClientRect()
		}

		/** Box of the character the caret sticks to */
		caret_rect(): DOMRect | null {
			const len = this.text_content().length
			const offset = this.caret_offset()
			if( offset < 0 || len === 0 ) return null
			return offset < len ? this.range_rect( offset, offset + 1 ) : this.range_rect( offset - 1, offset )
		}

		/** Whether the caret sits on the first / last visual line of the block */
		caret_lines() {
			const len = this.text_content().length
			const offset = this.caret_offset()
			if( offset < 0 || len === 0 ) return { first: true, last: true }

			const cur = this.caret_rect()
			const head = this.range_rect( 0, 1 )
			const tail = this.range_rect( len - 1, len )
			// No layout engine (server side render, tests): the block is a single line
			if( !cur || !head || !tail || !cur.height ) return { first: true, last: true }

			return {
				first: cur.top <= head.top + 1,
				last: cur.bottom >= tail.bottom - 1,
			}
		}

		/** Horizontal position of the caret in viewport pixels. 0 when unknown. */
		caret_x() {
			const rect = this.caret_rect()
			if( !rect ) return 0
			const len = this.text_content().length
			return this.caret_offset() < len ? rect.left : rect.right
		}

		/** Enter the block from a neighbour keeping the horizontal position */
		focus_column( x: number, offset: number, from_top: boolean ) {
			const node = this.node_el()
			node.focus()

			const box = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null

			if( x > 0 && box && box.height > 0 ) {
				const doc = node.ownerDocument
				const y = from_top ? box.top + 2 : box.bottom - 2
				const range = $bog_wysiwyg_caret_from_point( doc, x, y )
				if( range && node.contains( range.startContainer ) ) {
					const sel = this.selection()
					if( sel ) {
						range.collapse( true )
						sel.removeAllRanges()
						sel.addRange( range )
						return
					}
				}
			}

			this.focus_at( offset )
		}

		static render_cache = new WeakMap< $bog_wysiwyg_block, $mol_view >()

		override auto() {
			const node = this.dom_node() as HTMLElement
			const doc = this.$.$mol_dom_context.document
			const readonly = this.readonly()

			// Plugin with custom render
			const plugin = $bog_wysiwyg_plugin_registry.get( this.type() )
			if( plugin?.render ) {
				node.contentEditable = 'false'
				let component = $bog_wysiwyg_block.render_cache.get( this )
				if( !component ) {
					component = plugin.render( this )!
					if( component ) $bog_wysiwyg_block.render_cache.set( this, component )
				}
				if( component ) {
					try {
						const rendered = component.dom_tree()
						if( node.firstChild !== rendered ) {
							node.textContent = ''
							node.appendChild( rendered )
						}
					} catch( error ) {
						if( error instanceof Promise ) throw error // let $mol retry
						node.textContent = String( error )
					}
				} else {
					node.textContent = 'Loading plugin...'
				}
				return
			}

			if( readonly || this.is_static() ) {
				node.contentEditable = 'false'
				const html = this.html()
				if( node.innerHTML !== html ) {
					node.innerHTML = html
				}
				return
			}

			node.contentEditable = 'true'

			const html = this.html()
			if( node.innerHTML !== html ) {
				// Nodes are recreated wholesale, so the caret is remembered by text offset
				const offset = node === doc.activeElement ? this.caret_offset() : -1
				node.innerHTML = html
				if( offset >= 0 ) this.caret_place( offset )
			}
		}

		input_event( event?: Event ) {
			if( !event ) return null
			if( this.readonly() ) return event
			const node = event.target as HTMLElement
			this.try_markdown( node )
			this.html( node.innerHTML )
			this.on_input( event )
			return event
		}

		try_markdown( container: HTMLElement ) {
			const doc = container.ownerDocument
			const sel = doc.defaultView?.getSelection()
			if( !sel || sel.rangeCount === 0 ) return

			const cursor = sel.getRangeAt( 0 )
			const text_node = cursor.startContainer
			if( text_node.nodeType !== 3 /* Node.TEXT_NODE */ ) return

			const text = text_node.textContent ?? ''

			// Try link pattern first: [text](url)
			const link_match = link_pattern.exec( text )
			if( link_match ) {
				const link_text = link_match[ 1 ]
				const url = link_match[ 2 ]
				if( link_text && url ) {
					const el = doc.createElement( 'a' )
					el.href = url
					el.textContent = link_text
					this.replace_match_in_text( text_node as Text, link_match, el, sel )
					return
				}
			}

			// Try wiki link pattern: [[page_id]]
			const wiki_match = wiki_link_pattern.exec( text )
			if( wiki_match ) {
				const page_id = wiki_match[ 1 ]
				if( page_id ) {
					const el = doc.createElement( 'a' )
					el.href = '#' + page_id
					el.setAttribute( 'data-wiki-link', page_id )
					el.className = 'bog_wysiwyg_wiki_link'
					el.textContent = page_id
					this.replace_match_in_text( text_node as Text, wiki_match, el, sel )
					return
				}
			}

			// Try inline formatting patterns
			for( const pattern of markdown_patterns ) {
				const match = pattern.regex.exec( text )
				if( !match ) continue

				const content = match[ 1 ]
				if( !content ) continue

				const el = doc.createElement( pattern.tag )
				el.textContent = content
				this.replace_match_in_text( text_node as Text, match, el, sel )
				return
			}
		}

		replace_match_in_text( text_node: Text, match: RegExpExecArray, el: HTMLElement, sel: Selection ) {
			const start = match.index
			const end = start + match[ 0 ].length

			const range = text_node.ownerDocument.createRange()
			range.setStart( text_node, start )
			range.setEnd( text_node, end )
			range.deleteContents()
			range.insertNode( el )

			// Place cursor after the inserted element
			const after = text_node.ownerDocument.createRange()
			after.setStartAfter( el )
			after.collapse( true )
			sel.removeAllRanges()
			sel.addRange( after )
		}

		bold_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			this.$.$mol_dom_context.document.execCommand( 'bold' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		italic_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			this.$.$mol_dom_context.document.execCommand( 'italic' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		underline_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			this.$.$mol_dom_context.document.execCommand( 'underline' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		strike_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()
			this.$.$mol_dom_context.document.execCommand( 'strikeThrough' )
			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		link_exec( event?: KeyboardEvent ) {
			if( !event ) return null
			event.preventDefault()

			const url = this.$.$mol_dom_context.prompt( this.$.$mol_locale.text( '$bog_wysiwyg_block_link_url_prompt' ) )
			if( !url ) return event

			const doc = this.$.$mol_dom_context.document
			const sel = doc.defaultView?.getSelection()
			if( sel && sel.toString().length > 0 ) {
				doc.execCommand( 'createLink', false, url )
			} else {
				const a = doc.createElement( 'a' )
				a.href = url
				a.textContent = url
				doc.execCommand( 'insertHTML', false, a.outerHTML )
			}

			this.html( ( this.dom_node() as HTMLElement ).innerHTML )
			return event
		}

		paste_event( event?: ClipboardEvent ) {
			if( !event ) return null
			if( this.readonly() ) { event.preventDefault(); return event }

			const data = event.clipboardData
			if( !data ) return event

			for( const item of data.items ) {
				if( item.type.startsWith( 'image/' ) ) {
					event.preventDefault()
					const file = item.getAsFile()
					if( file ) this.insert_image_file( file )
					return event
				}
			}

			// Nothing from the clipboard reaches the DOM as is: the editor rebuilds it from drafts
			event.preventDefault()
			this.paste_data( data )

			return event
		}

		/**
		 * Clipboard content to editor content. Split off `paste_event` so it can be
		 * driven with a bare `getData` and without a DataTransfer.
		 */
		paste_data( data: $bog_wysiwyg_paste_data ) {

			// A code block takes the clipboard as plain text, markup and all
			if( this.type() === 'code' ) {
				const text = data.getData( 'text/plain' ) ?? ''
				if( !text ) return
				this.paste_at_caret( [ { type: 'code', content: $bog_wysiwyg_escape_html( text ) } ], true )
				return
			}

			const drafts = $bog_wysiwyg_paste.from_data( data )
			if( !drafts.length ) return

			// A single unbroken paragraph belongs in the current text, not in a block of its own
			const inline = drafts.length === 1
				&& drafts[ 0 ].type === 'paragraph'
				&& !drafts[ 0 ].content.includes( '<br>' )

			if( !inline ) {
				this.paste_at_caret( drafts, false )
				return
			}

			// Every draft comes trimmed, but a fragment copied mid sentence needs its spaces back
			const text = data.getData( 'text/plain' ) ?? ''
			const lead = /^\s/.test( text ) ? ' ' : ''
			const trail = /\s$/.test( text ) ? ' ' : ''

			this.paste_at_caret( [ { type: 'paragraph', content: lead + drafts[ 0 ].content + trail } ], true )
		}

		/** Hands the drafts to the page together with the two halves of the block around the caret */
		paste_at_caret( drafts: readonly $bog_wysiwyg_paste_draft[], inline: boolean ) {

			const node = this.node_el()
			const caret = Math.max( 0, this.caret_offset() )
			let from = caret
			let to = caret

			const sel = this.selection()
			if( sel && !sel.isCollapsed && sel.rangeCount > 0 ) {
				const range = sel.getRangeAt( 0 )
				// A selection running into other blocks is none of this block's business
				if( node.contains( range.startContainer ) && node.contains( range.endContainer ) ) {
					from = $bog_wysiwyg_offset_of( node, range.startContainer, range.startOffset )
					to = $bog_wysiwyg_offset_of( node, range.endContainer, range.endOffset )
				}
			}

			this.on_paste_blocks({
				drafts,
				head: this.html_before( from ),
				tail: this.html_after( to ),
				inline,
			})
		}

		drop_event( event?: DragEvent ) {
			if( !event ) return null
			if( this.readonly() ) { event.preventDefault(); return event }

			const files = event.dataTransfer?.files
			if( !files ) return event

			for( const file of files ) {
				if( file.type.startsWith( 'image/' ) ) {
					event.preventDefault()
					this.insert_image_file( file )
					return event
				}
			}

			return event
		}

		dragover_event( event?: DragEvent ) {
			if( !event ) return null
			event.preventDefault()
			return event
		}

		insert_image_file( file: File ) {
			const reader = new FileReader()
			reader.onload = () => {
				const src = reader.result as string
				this.on_image( src )
			}
			reader.readAsDataURL( file )
		}

		keydown_event( event?: KeyboardEvent ) {
			if( !event ) return null
			if( this.readonly() ) return event

			const node = this.node_el()

			// Static rendered blocks (image, plugin render): only Backspace/Enter
			if( this.is_image() || $bog_wysiwyg_plugin_registry.get( this.type() )?.render ) {
				if( event.key === 'Backspace' || event.key === 'Delete' ) {
					event.preventDefault()
					this.on_remove( event )
					return event
				}
				if( event.key === 'Enter' && !event.shiftKey ) {
					event.preventDefault()
					this.on_enter( event )
					return event
				}
				return event
			}

			// When AI menu is open, delegate navigation keys
			if( this.ai_open() ) {
				if( [ 'ArrowDown', 'ArrowUp', 'Enter', 'Escape' ].includes( event.key ) ) {
					event.preventDefault()
					this.on_ai_key( event )
					return event
				}
				if( event.key.length === 1 && !event.ctrlKey && !event.metaKey ) {
					this.on_ai_key( event )
					return event
				}
			}

			// When menu is open, delegate navigation keys
			if( this.menu_open() ) {
				if( [ 'ArrowDown', 'ArrowUp', 'Enter', 'Escape' ].includes( event.key ) ) {
					event.preventDefault()
					this.on_menu_key( event )
					return event
				}
				// Any printable character: close menu and let character through
				if( event.key.length === 1 && !event.ctrlKey && !event.metaKey ) {
					this.on_menu_key( event )
					return event
				}
			}

			const collapsed = this.selection_collapsed()
			const text = node.textContent ?? ''

			// ArrowUp / ArrowDown on the edge line: step into the neighbour block
			if( collapsed && !event.shiftKey && ( event.key === 'ArrowUp' || event.key === 'ArrowDown' ) ) {
				const up = event.key === 'ArrowUp'
				const lines = this.caret_lines()
				if( up ? lines.first : lines.last ) {
					event.preventDefault()
					this.on_nav({
						dir: up ? 'up' : 'down',
						x: this.caret_x(),
						offset: Math.max( 0, this.caret_offset() ),
					})
					return event
				}
			}

			// Enter: split the block at the caret, or append an empty one at the tail
			if( event.key === 'Enter' && !event.shiftKey ) {
				event.preventDefault()
				// A selection inside this block goes away first
				const wiped = collapsed ? false : this.delete_range()
				const offset = this.caret_offset()
				if( ( collapsed || wiped ) && offset >= 0 && offset < this.text_content().length ) {
					this.on_split({
						head: this.html_before( offset ),
						tail: this.html_after( offset ),
					})
					return event
				}
				this.on_enter( event )
				return event
			}

			// Backspace on empty: remove block
			if( event.key === 'Backspace' && collapsed && !text.trim() ) {
				event.preventDefault()
				this.on_remove( event )
				return event
			}

			// Backspace at the very start: glue with the previous block
			if( event.key === 'Backspace' && collapsed && this.caret_offset() === 0 ) {
				event.preventDefault()
				this.on_merge_prev( event )
				return event
			}

			// Delete at the very end: pull the next block in
			if( event.key === 'Delete' && collapsed && this.caret_offset() === text.length ) {
				event.preventDefault()
				this.on_merge_next( event )
				return event
			}

			// Slash on empty: open slash menu
			if( event.key === '/' && !text.trim() ) {
				event.preventDefault()
				this.on_slash( event )
				return event
			}

			// @ : open AI menu
			if( event.key === '@' ) {
				event.preventDefault()
				this.on_ai( event )
				return event
			}

			// Ctrl/Cmd+J: open AI menu
			if( event.key === 'j' && ( event.ctrlKey || event.metaKey ) && !event.shiftKey ) {
				event.preventDefault()
				this.on_ai( event )
				return event
			}

			// Ctrl/Cmd+K: insert link
			if( event.key === 'k' && ( event.ctrlKey || event.metaKey ) && !event.shiftKey ) {
				this.link_exec( event )
				return event
			}

			return event
		}

	}

}
