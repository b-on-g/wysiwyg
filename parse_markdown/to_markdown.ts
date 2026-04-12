namespace $ {

	export function $bog_wysiwyg_html_to_md( html: string ): string {
		let text = html
		// <br> → \n
		text = text.replace( /<br\s*\/?>/gi, '\n' )
		// <b> / <strong> → **text**
		text = text.replace( /<(?:b|strong)>(.+?)<\/(?:b|strong)>/gi, '**$1**' )
		// <i> / <em> → *text*
		text = text.replace( /<(?:i|em)>(.+?)<\/(?:i|em)>/gi, '*$1*' )
		// <code> → `text`
		text = text.replace( /<code>(.+?)<\/code>/gi, '`$1`' )
		// <s> / <del> → ~~text~~
		text = text.replace( /<(?:s|del)>(.+?)<\/(?:s|del)>/gi, '~~$1~~' )
		// <a href="url">text</a> → [text](url)
		text = text.replace( /<a[^>]*href="([^"]*)"[^>]*>(.+?)<\/a>/gi, '[$2]($1)' )
		// Strip remaining tags
		text = text.replace( /<[^>]*>/g, '' )
		// Decode HTML entities
		text = text.replace( /&amp;/g, '&' )
		text = text.replace( /&lt;/g, '<' )
		text = text.replace( /&gt;/g, '>' )
		text = text.replace( /&quot;/g, '"' )
		text = text.replace( /&nbsp;/g, ' ' )
		return text
	}

}
