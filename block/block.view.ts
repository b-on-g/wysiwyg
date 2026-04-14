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

			if( node !== doc.activeElement ) {
				const html = this.html()
				if( node.innerHTML !== html ) {
					node.innerHTML = html
				}
			}
		}

		input_event( event?: Event ) {
			if( !event ) return null
			if( this.readonly() ) return event
			const node = event.target as HTMLElement
			this.try_markdown( node )
			this.html( node.innerHTML )
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

			const items = event.clipboardData?.items
			if( !items ) return event

			for( const item of items ) {
				if( item.type.startsWith( 'image/' ) ) {
					event.preventDefault()
					const file = item.getAsFile()
					if( file ) this.insert_image_file( file )
					return event
				}
			}

			const text = event.clipboardData?.getData( 'text/plain' ) ?? ''
			if( text.includes( '\n' ) ) {
				event.preventDefault()
				const blocks = $bog_wysiwyg_parse_markdown( text )
				if( blocks.length > 0 ) {
					this.on_paste_blocks( blocks )
				}
				return event
			}

			return event
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

			const node = event.target as HTMLElement

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

			// Enter: create new block
			if( event.key === 'Enter' && !event.shiftKey ) {
				event.preventDefault()
				this.on_enter( event )
				return event
			}

			// Backspace on empty: remove block
			if( event.key === 'Backspace' && !node.textContent?.trim() ) {
				event.preventDefault()
				this.on_remove( event )
				return event
			}

			// Slash on empty: open slash menu
			if( event.key === '/' && !node.textContent?.trim() ) {
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
