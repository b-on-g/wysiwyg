namespace $ {

	$mol_style_attach( 'bog_wysiwyg_block_embed', `
		[bog_wysiwyg_block_type="embed"] {
			background: var(--mol_theme_card);
			padding: 0.75rem 1rem;
			border-radius: 0.5rem;
			cursor: default;
		}

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
