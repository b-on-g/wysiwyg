namespace $ {

	export function $bog_wysiwyg_parse_markdown( text: string ) {

		const blocks: { type: string, content: string, level?: number }[] = []
		const lines = text.split( '\n' )

		let i = 0
		while( i < lines.length ) {
			const line = lines[ i ]

			// Skip empty lines
			if( !line.trim() ) {
				i++
				continue
			}

			// Code block: ```
			if( line.trimStart().startsWith( '```' ) ) {
				const code_lines: string[] = []
				i++
				while( i < lines.length && !lines[ i ].trimStart().startsWith( '```' ) ) {
					code_lines.push( lines[ i ] )
					i++
				}
				if( i < lines.length ) i++ // skip closing ```
				blocks.push( { type: 'code', content: escape_html( code_lines.join( '\n' ) ) } )
				continue
			}

			// Heading: # ## ###
			const heading_match = line.match( /^(#{1,3})\s+(.+)/ )
			if( heading_match ) {
				blocks.push( {
					type: 'heading',
					content: inline_md( heading_match[ 2 ] ),
					level: heading_match[ 1 ].length,
				} )
				i++
				continue
			}

			// Divider: --- *** ___
			if( /^[-*_]{3,}\s*$/.test( line.trim() ) ) {
				blocks.push( { type: 'divider', content: '' } )
				i++
				continue
			}

			// Quote: > text
			if( line.trimStart().startsWith( '> ' ) || line.trimStart() === '>' ) {
				const quote_lines: string[] = []
				while( i < lines.length && ( lines[ i ].trimStart().startsWith( '> ' ) || lines[ i ].trimStart() === '>' ) ) {
					quote_lines.push( lines[ i ].replace( /^>\s?/, '' ) )
					i++
				}
				blocks.push( { type: 'quote', content: inline_md( quote_lines.join( '<br>' ) ) } )
				continue
			}

			// Paragraph: collect non-empty lines until empty line or special block
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
				blocks.push( { type: 'paragraph', content: inline_md( para_lines.join( '<br>' ) ) } )
			}
		}

		return blocks
	}

	function inline_md( text: string ): string {
		// Links: [text](url)
		text = text.replace( /\[(.+?)\]\((\S+?)\)/g, '<a href="$2">$1</a>' )
		// Bold: **text**
		text = text.replace( /\*\*(.+?)\*\*/g, '<b>$1</b>' )
		// Italic: *text* (not inside bold tags)
		text = text.replace( /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>' )
		// Code: `text`
		text = text.replace( /`(.+?)`/g, '<code>$1</code>' )
		// Strike: ~~text~~
		text = text.replace( /~~(.+?)~~/g, '<s>$1</s>' )
		return text
	}

	function escape_html( text: string ): string {
		return text
			.replace( /&/g, '&amp;' )
			.replace( /</g, '&lt;' )
			.replace( />/g, '&gt;' )
	}

}
