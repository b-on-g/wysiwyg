namespace $ {

	$mol_style_define( $bog_wysiwyg_block, {

		'[bog_wysiwyg_block_type]': {
			embed: {
				background: { color: $mol_theme.card },
				padding: {
					top: '0.75rem',
					bottom: '0.75rem',
					left: '1rem',
					right: '1rem',
				},
				borderRadius: '0.5rem',
				cursor: 'default',
			},
		},

	} )

	$mol_style_attach( 'bog_wysiwyg_block_embed', `
		[bog_wysiwyg_block_type="embed"] a {
			color: var(--mol_theme_focus);
			text-decoration: none;
			font-weight: 500;
			word-break: break-all;
		}

		[bog_wysiwyg_block_type="embed"] a:hover {
			text-decoration: underline;
		}

		[bog_wysiwyg_block_type="embed"] a::before {
			content: "\\1F517 ";
		}
	` )

}
