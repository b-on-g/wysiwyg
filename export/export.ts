namespace $ {

	/**
	 * Plain block data for markdown export.
	 * Deliberately free of Giper Baza objects: the serializer stays a pure function
	 * and can be tested without a land.
	 */
	export type $bog_wysiwyg_export_block = {
		readonly type: string
		readonly level?: number
		readonly content: string
	}

	/** Target platform of the exported markdown. */
	export type $bog_wysiwyg_export_dialect = 'common' | 'habr' | 'devto' | 'telegram'

	/** Human readable words injected into generated text, so the core stays locale agnostic. */
	export type $bog_wysiwyg_export_labels = {
		readonly image?: string
		readonly images?: string
	}

	export type $bog_wysiwyg_export_config = {
		readonly dialect?: $bog_wysiwyg_export_dialect
		/** Article title, used by the dev.to front matter */
		readonly title?: string
		/** dev.to tags, sanitized down to 4 alphanumeric ones */
		readonly tags?: readonly string[]
		/** dev.to cover image, resolved against `base` like any other image */
		readonly cover?: string
		readonly published?: boolean
		/** Origin of the Giper Baza master node, used to absolutize `?BAZA:file=...` uris */
		readonly base?: string
		/** Pull every image out of the text into a trailing list */
		readonly images_apart?: boolean
		readonly labels?: $bog_wysiwyg_export_labels
	}

	/** Telegram refuses messages longer than this. */
	export const $bog_wysiwyg_export_telegram_limit = 4096

	type Traits = {
		/** Backslash-escape markdown punctuation in plain text runs */
		escape: boolean
		/** `#` headings are rendered by the platform */
		headings: boolean
		/** Added to every heading level before clamping */
		heading_shift: number
		heading_max: number
		/** Markdown tables are rendered by the platform */
		tables: boolean
		bullet: string
		divider: string
		italic: string
		strike: string
		line_break: string
		/** Underline has no markdown syntax at all */
		underline: 'html' | 'drop'
		images: 'md' | 'url'
		limit: number
	}

	const dialects: Record< $bog_wysiwyg_export_dialect, Traits > = {

		common: {
			escape: true,
			headings: true,
			heading_shift: 0,
			heading_max: 6,
			tables: true,
			bullet: '-',
			divider: '---',
			italic: '*',
			strike: '~~',
			line_break: '  \n',
			underline: 'html',
			images: 'md',
			limit: Infinity,
		},

		/** Habr renders no markdown tables, and `#` collides with the article title */
		habr: {
			escape: true,
			headings: true,
			heading_shift: 1,
			heading_max: 6,
			tables: false,
			bullet: '-',
			divider: '---',
			italic: '*',
			strike: '~~',
			line_break: '  \n',
			underline: 'drop',
			images: 'md',
			limit: Infinity,
		},

		devto: {
			escape: true,
			headings: true,
			heading_shift: 0,
			heading_max: 6,
			tables: true,
			bullet: '-',
			divider: '---',
			italic: '*',
			strike: '~~',
			line_break: '  \n',
			underline: 'html',
			images: 'md',
			limit: Infinity,
		},

		/** Telegram clients know bold, italic, strike, code, links and quotes. Nothing else. */
		telegram: {
			escape: false,
			headings: false,
			heading_shift: 0,
			heading_max: 6,
			tables: false,
			bullet: '•',
			divider: '————————',
			italic: '__',
			strike: '~~',
			line_break: '\n',
			underline: 'drop',
			images: 'url',
			limit: $bog_wysiwyg_export_telegram_limit,
		},

	}

	/** Message length the dialect can carry, `Infinity` when unlimited. */
	export function $bog_wysiwyg_export_limit( dialect: $bog_wysiwyg_export_dialect ) {
		return ( dialects[ dialect ] ?? dialects.common ).limit
	}

	const tag_pattern = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g
	const attr_pattern = /([^\s=\/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

	const entities: Record< string, string > = {
		amp: '&',
		lt: '<',
		gt: '>',
		quot: '"',
		apos: "'",
		nbsp: ' ',
		mdash: '—',
		ndash: '–',
		hellip: '…',
		laquo: '«',
		raquo: '»',
		copy: '©',
		middot: '·',
	}

	function decode( text: string ) {
		return text.replace( /&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, ( all, body: string ) => {
			if( body[ 0 ] !== '#' ) return entities[ body ] ?? all
			const hex = body[ 1 ] === 'x' || body[ 1 ] === 'X'
			const code = parseInt( body.slice( hex ? 2 : 1 ), hex ? 16 : 10 )
			if( !Number.isFinite( code ) || code <= 0 || code > 0x10FFFF ) return all
			return String.fromCodePoint( code )
		} )
	}

	function attrs_of( source: string ) {
		const res: Record< string, string > = {}
		attr_pattern.lastIndex = 0
		let found: RegExpExecArray | null
		while( ( found = attr_pattern.exec( source ) ) ) {
			res[ found[ 1 ].toLowerCase() ] = decode( found[ 2 ] ?? found[ 3 ] ?? found[ 4 ] ?? '' )
		}
		return res
	}

	/** Punctuation that would otherwise start inline markup. */
	function escape( text: string ) {
		return text.replace( /([\\`*_\[\]~])/g, '\\$1' )
	}

	/** Punctuation that only means something at the very beginning of a line. */
	function escape_start( text: string ) {
		return text
			.replace( /^(\s*)(#{1,6}|>|[-+])(\s|$)/, '$1\\$2$3' )
			.replace( /^(\s*)(\d{1,9})([.)])(\s|$)/, '$1$2\\$3$4' )
	}

	/** Markdown link targets break on spaces and unbalanced parens. */
	function uri_md( uri: string ) {
		return uri.replace( /[ ()<>]/g, char => ( {
			' ': '%20',
			'(': '%28',
			')': '%29',
			'<': '%3C',
			'>': '%3E',
		} )[ char ] ?? char )
	}

	/**
	 * Absolute address of a file for an outside platform.
	 * Giper Baza serves files at a relative `?BAZA:file=<link>;name=<name>` uri,
	 * which only resolves against the master node origin.
	 */
	export function $bog_wysiwyg_export_uri( src: string, base?: string ): string {

		const uri = ( src ?? '' ).trim()
		if( !uri ) return ''

		// http:, https:, data:, blob: and friends are already absolute
		if( /^[a-zA-Z][\w+.-]*:/.test( uri ) ) return uri
		if( uri.startsWith( '//' ) ) return uri

		// An anchor stays inside whatever page the reader is on
		if( uri[ 0 ] === '#' ) return uri

		const origin = ( base ?? '' ).trim()
		if( !origin ) return uri

		if( uri[ 0 ] === '/' ) return origin.replace( /\/+$/, '' ) + uri

		return origin.replace( /[?#].*$/, '' ).replace( /\/*$/, '/' ) + uri
	}

	/** Tags stripped, entities decoded, `<br>` and block ends turned into newlines. */
	export function $bog_wysiwyg_export_plain( html: string ): string {
		return decode(
			( html ?? '' )
				.replace( /<br\s*\/?>/gi, '\n' )
				.replace( /<\/(?:p|div|tr|li|h[1-6]|blockquote)\s*>/gi, '\n' )
				.replace( /<[^>]*>/g, '' )
		)
			.replace( /[ \t]+$/gm, '' )
			.replace( /\n{3,}/g, '\n\n' )
			.trim()
	}

	type Context = {
		traits: Traits
		base: string
		images_apart: boolean
		images: { uri: string, alt: string }[]
		labels: { image: string, images: string }
	}

	type Frame = {
		name: string
		close: string
		/** Offset in the output where a code run started */
		mark: number
		code: boolean
	}

	/** Inline HTML of a single block turned into inline markdown. */
	function inline( html: string, ctx: Context ): string {

		const t = ctx.traits
		const stack: Frame[] = []
		const lists: { ordered: boolean, index: number }[] = []

		let out = ''
		let pos = 0
		let raw = 0

		const at_line_start = () => !out || out.endsWith( '\n' )

		const put_text = ( source: string ) => {
			if( !source ) return
			let text = decode( source )
			if( raw > 0 ) {
				out += text
				return
			}
			text = text.replace( /\s+/g, ' ' )
			if( at_line_start() ) text = text.replace( /^ +/, '' )
			if( !text ) return
			if( t.escape ) {
				text = escape( text )
				if( at_line_start() ) text = escape_start( text )
			}
			out += text
		}

		/** Structural newline: starts a list item, an image or a fence on its own line */
		const put_line = () => {
			if( at_line_start() ) return
			out += '\n'
		}

		/** Visible line break the reader should see, `<br>` and closing block tags make one */
		const put_break = () => {
			if( at_line_start() ) return
			out += t.line_break
		}

		const open = ( name: string, start: string, close: string, code = false ) => {
			if( code ) raw += 1
			else out += start
			stack.push( { name, close, mark: out.length, code } )
		}

		const close = ( name: string ) => {
			for( let i = stack.length - 1; i >= 0; --i ) {
				if( stack[ i ].name !== name ) continue
				for( let j = stack.length - 1; j >= i; --j ) {
					const frame = stack[ j ]
					if( !frame.code ) {
						out += frame.close
						continue
					}
					raw -= 1
					const body = out.slice( frame.mark )
					if( !body ) continue
					const runs = body.match( /`+/g ) ?? []
					const fence = '`'.repeat( runs.reduce( ( max, run ) => Math.max( max, run.length ), 0 ) + 1 )
					const pad = /^`|`$/.test( body ) ? ' ' : ''
					out = out.slice( 0, frame.mark ) + fence + pad + body + pad + fence
				}
				stack.length = i
				return
			}
		}

		const put_image = ( attrs: Record< string, string > ) => {
			const uri = $bog_wysiwyg_export_uri( attrs.src ?? '', ctx.base )
			if( !uri ) return
			const alt = ( attrs.alt ?? attrs.title ?? '' ).replace( /[\[\]]/g, '' ).trim()
			if( ctx.images_apart ) {
				ctx.images.push( { uri, alt } )
				out += '[' + ctx.labels.image + ' ' + ctx.images.length + ']'
				return
			}
			if( t.images === 'url' ) {
				put_line()
				out += uri
				return
			}
			out += '![' + alt + '](' + uri_md( uri ) + ')'
		}

		const put_item = () => {
			put_line()
			const list = lists[ lists.length - 1 ]
			const indent = '  '.repeat( Math.max( lists.length - 1, 0 ) )
			if( !list ) {
				out += indent + t.bullet + ' '
				return
			}
			list.index += 1
			out += indent + ( list.ordered ? list.index + '.' : t.bullet ) + ' '
		}

		tag_pattern.lastIndex = 0
		let found: RegExpExecArray | null

		while( ( found = tag_pattern.exec( html ) ) ) {

			put_text( html.slice( pos, found.index ) )
			pos = found.index + found[ 0 ].length

			const closing = !!found[ 1 ]
			const name = found[ 2 ].toLowerCase()

			if( closing ) {
				switch( name ) {
					case 'b': case 'strong': case 'i': case 'em':
					case 's': case 'del': case 'strike':
					case 'code': case 'kbd': case 'samp': case 'tt':
					case 'u': case 'ins': case 'sup': case 'sub': case 'a':
						close( name )
						break
					case 'ul': case 'ol':
						lists.pop()
						put_line()
						break
					case 'li':
						put_line()
						break
					case 'p': case 'div': case 'blockquote':
					case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
						put_break()
						break
					case 'pre':
						raw -= 1
						put_line()
						break
				}
				continue
			}

			switch( name ) {

				case 'br':
					out += t.line_break
					break

				case 'img':
					put_image( attrs_of( found[ 3 ] ?? '' ) )
					break

				case 'hr':
					put_line()
					out += t.divider + '\n'
					break

				case 'b': case 'strong':
					open( name, '**', '**' )
					break

				case 'i': case 'em':
					open( name, t.italic, t.italic )
					break

				case 's': case 'del': case 'strike':
					open( name, t.strike, t.strike )
					break

				case 'code': case 'kbd': case 'samp': case 'tt':
					open( name, '', '', true )
					break

				// No markdown syntax exists for these, so either raw html or nothing
				case 'u': case 'ins':
					if( t.underline === 'html' ) open( name, '<u>', '</u>' )
					else open( name, '', '' )
					break

				case 'sup': case 'sub':
					if( t.underline === 'html' ) open( name, `<${ name }>`, `</${ name }>` )
					else open( name, '', '' )
					break

				case 'a': {
					const attrs = attrs_of( found[ 3 ] ?? '' )
					const wiki = attrs[ 'data-wiki-link' ]
					const href = wiki ? '#' + wiki : ( attrs.href ?? '' )
					if( !href ) break
					open( 'a', '[', '](' + uri_md( $bog_wysiwyg_export_uri( href, ctx.base ) ) + ')' )
					break
				}

				case 'ul': case 'ol':
					lists.push( { ordered: name === 'ol', index: 0 } )
					put_line()
					break

				case 'li':
					put_item()
					break

				case 'pre':
					raw += 1
					put_line()
					break

				case 'p': case 'div': case 'blockquote':
				case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
					put_line()
					break

			}

		}

		put_text( html.slice( pos ) )

		while( stack.length ) close( stack[ stack.length - 1 ].name )

		// Trailing spaces are the markdown hard break, so only the very edges get trimmed
		return out.replace( /\n{3,}/g, '\n\n' ).replace( /^\s+/, '' ).replace( /\s+$/, '' )
	}

	const row_pattern = /<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi
	const cell_pattern = /<(t[hd])\b[^>]*>([\s\S]*?)<\/\1\s*>/gi

	type Table = { head: readonly string[] | null, body: readonly ( readonly string[] )[] }

	function parse_table( html: string, ctx: Context ): Table | null {

		const rows: string[][] = []
		let headed = false

		row_pattern.lastIndex = 0
		let row: RegExpExecArray | null

		while( ( row = row_pattern.exec( html ) ) ) {
			const cells: string[] = []
			cell_pattern.lastIndex = 0
			let cell: RegExpExecArray | null
			while( ( cell = cell_pattern.exec( row[ 1 ] ) ) ) {
				if( cell[ 1 ].toLowerCase() === 'th' && !rows.length ) headed = true
				cells.push( inline( cell[ 2 ], ctx ).replace( /\n+/g, ' ' ).trim() )
			}
			if( cells.length ) rows.push( cells )
		}

		if( !rows.length ) {

			// A table pasted as plain markdown text still deserves to be reformatted
			const lines = $bog_wysiwyg_export_plain( html ).split( '\n' )
				.map( line => line.trim() )
				.filter( Boolean )

			for( const line of lines ) {
				if( !line.includes( '|' ) ) continue
				if( /^\|?[\s:|-]+\|[\s:|-]*$/.test( line ) ) {
					if( rows.length === 1 ) headed = true
					continue
				}
				rows.push(
					line.replace( /^\|/, '' ).replace( /\|$/, '' )
						.split( '|' ).map( part => part.trim() )
				)
			}

		}

		if( !rows.length ) return null

		return headed
			? { head: rows[ 0 ], body: rows.slice( 1 ) }
			: { head: null, body: rows }
	}

	function table_grid( table: Table ) {

		const head = table.head ?? table.body[ 0 ] ?? []
		const body = table.head ? table.body : table.body.slice( 1 )
		const width = table.body.reduce( ( max, row ) => Math.max( max, row.length ), head.length )

		const line = ( cells: readonly string[] ) => '| ' + Array.from(
			{ length: width },
			( _, i ) => ( cells[ i ] ?? '' ).replace( /\|/g, '\\|' ) || ' ',
		).join( ' | ' ) + ' |'

		return [
			line( head ),
			'| ' + Array.from( { length: width }, () => '---' ).join( ' | ' ) + ' |',
			... body.map( line ),
		].join( '\n' )
	}

	/** Habr and Telegram both ignore markdown tables, so a table becomes a nested list. */
	function table_list( table: Table, ctx: Context ) {

		const bullet = ctx.traits.bullet
		const head = table.head

		if( !head ) {
			return table.body.map( row => bullet + ' ' + row.filter( Boolean ).join( ' — ' ) ).join( '\n' )
		}

		return table.body.map( row => {
			const lines = [ bullet + ' **' + ( row[ 0 ] ?? '' ) + '**' ]
			for( let i = 1; i < Math.max( head.length, row.length ); ++i ) {
				const title = head[ i ]
				const value = row[ i ] ?? ''
				if( !value ) continue
				lines.push( '  ' + bullet + ' ' + ( title ? title + ': ' : '' ) + value )
			}
			return lines.join( '\n' )
		} ).join( '\n' )
	}

	function block_md( block: $bog_wysiwyg_export_block, ctx: Context ): string | null {

		const t = ctx.traits
		const type = block.type || 'paragraph'
		const html = block.content ?? ''

		switch( type ) {

			case 'divider':
				return t.divider

			case 'code': {
				const code = $bog_wysiwyg_export_plain( html )
				if( !code ) return null
				const runs = code.match( /`{3,}/g ) ?? []
				const fence = '`'.repeat( runs.reduce( ( max, run ) => Math.max( max, run.length ), 2 ) + 1 )
				return fence + '\n' + code + '\n' + fence
			}

			case 'heading': {
				const text = inline( html, ctx ).replace( /\s*\n\s*/g, ' ' ).trim()
				if( !text ) return null
				if( !t.headings ) return '**' + text + '**'
				const level = Math.min(
					Math.max( Math.round( block.level ?? 1 ), 1 ) + t.heading_shift,
					t.heading_max,
				)
				return '#'.repeat( level ) + ' ' + text
			}

			case 'quote': {
				const text = inline( html, ctx )
				if( !text ) return null
				return text.split( '\n' ).map( line => line ? '> ' + line : '>' ).join( '\n' )
			}

			case 'list': {
				const text = inline( html, ctx )
				if( !text ) return null
				// `<li>` inside the content already produced its own bullets
				if( /<li\b/i.test( html ) ) return text
				const indent = ' '.repeat( t.bullet.length + 1 )
				return t.bullet + ' ' + text.split( '\n' ).join( '\n' + indent )
			}

			case 'table':
				return table_md( html, ctx )

			default: {
				const text = inline( html, ctx )
				return text || null
			}

		}

	}

	function table_md( html: string, ctx: Context ) {
		const table = parse_table( html, ctx )
		if( !table ) return null
		return ctx.traits.tables ? table_grid( table ) : table_list( table, ctx )
	}

	function yaml_str( text: string ) {
		return '"' + text.replace( /\\/g, '\\\\' ).replace( /"/g, '\\"' ).replace( /\n/g, ' ' ) + '"'
	}

	function front_matter( config: $bog_wysiwyg_export_config ) {

		const tags = ( config.tags ?? [] )
			.map( tag => tag.trim().replace( /[^\p{L}\p{N}]/gu, '' ).toLowerCase() )
			.filter( Boolean )
			.slice( 0, 4 )

		const lines = [
			'---',
			'title: ' + yaml_str( config.title ?? '' ),
			'published: ' + ( config.published ? 'true' : 'false' ),
			'tags: ' + tags.join( ', ' ),
		]

		const cover = $bog_wysiwyg_export_uri( config.cover ?? '', config.base )
		if( cover ) lines.push( 'cover_image: ' + yaml_str( cover ) )

		lines.push( '---' )

		return lines.join( '\n' ) + '\n\n'
	}

	function images_md( ctx: Context ) {

		const title = ctx.traits.headings
			? '## ' + ctx.labels.images
			: '**' + ctx.labels.images + '**'

		const lines = ctx.images.map(
			( image, i ) => `${ i + 1 }. ${ image.alt ? image.alt + ' — ' : '' }${ image.uri }`
		)

		return title + '\n\n' + lines.join( '\n' )
	}

	/**
	 * Pure serializer: plain blocks in, markdown string out.
	 * Knows nothing about Giper Baza, the DOM or $mol.
	 */
	export function $bog_wysiwyg_export_markdown(
		blocks: readonly $bog_wysiwyg_export_block[],
		config: $bog_wysiwyg_export_config = {},
	): string {

		const dialect = config.dialect ?? 'common'
		const traits = dialects[ dialect ] ?? dialects.common

		const ctx: Context = {
			traits,
			base: config.base ?? '',
			images_apart: !!config.images_apart,
			images: [],
			labels: {
				image: config.labels?.image || 'Image',
				images: config.labels?.images || 'Images',
			},
		}

		const parts: { type: string, md: string }[] = []

		for( const block of blocks ?? [] ) {
			const md = block_md( block, ctx )
			if( md === null || md === '' ) continue
			parts.push( { type: block.type, md } )
		}

		let body = ''

		for( let i = 0; i < parts.length; ++i ) {
			// Neighbour list items must stay in one markdown list, so a single newline joins them
			if( i ) body += parts[ i ].type === 'list' && parts[ i - 1 ].type === 'list' ? '\n' : '\n\n'
			body += parts[ i ].md
		}

		if( ctx.images.length ) body += ( body ? '\n\n' : '' ) + images_md( ctx )

		const head = dialect === 'devto' ? front_matter( config ) : ''

		return ( head + body ).trim()
	}

	/**
	 * Cuts markdown into messages no longer than `limit`, preferring block boundaries.
	 * Telegram needs it, everybody else gets a single chunk.
	 */
	export function $bog_wysiwyg_export_split( text: string, limit = $bog_wysiwyg_export_telegram_limit ): readonly string[] {

		const source = ( text ?? '' ).trim()
		if( !source ) return []
		if( !Number.isFinite( limit ) || limit < 1 || source.length <= limit ) return [ source ]

		const parts: string[] = []
		let current = ''

		const flush = () => {
			if( current.trim() ) parts.push( current.trim() )
			current = ''
		}

		const put = ( chunk: string, separator: string ) => {
			if( !current ) {
				current = chunk
				return
			}
			if( current.length + separator.length + chunk.length <= limit ) {
				current += separator + chunk
				return
			}
			flush()
			current = chunk
		}

		for( const block of source.split( '\n\n' ) ) {

			if( block.length <= limit ) {
				put( block, '\n\n' )
				continue
			}

			for( const line of block.split( '\n' ) ) {

				if( line.length <= limit ) {
					put( line, '\n' )
					continue
				}

				flush()
				for( let i = 0; i < line.length; i += limit ) parts.push( line.slice( i, i + limit ) )

			}

		}

		flush()

		return parts
	}

}
