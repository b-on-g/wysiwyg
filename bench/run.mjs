/*
 * Where the block editor stops feeling instant.
 *
 *   npx mam bog/wysiwyg/bench      # build the bundle
 *   node bog/wysiwyg/bench/run.mjs # run the bench
 *
 * NOT a test. It runs for a minute or so, it drives Giper Baza directly, and a test that does
 * that hangs the whole MAM build. Keep it out of every test run — see readme.md.
 */

import * as crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname( fileURLToPath( import.meta.url ) )
const require = createRequire( import.meta.url )

const bundle = join( here, '-', 'node.js' )
const $ = require( bundle )

/*
 * Giper Baza signs every batch of Units with Ed25519, and WebCrypto exposes sign/verify as
 * promises only. A promise on the write path suspends a fiber, and a suspended fiber is exactly
 * how a Baza benchmark turns into a hang. So the same curve is plugged in through `node:crypto`,
 * which has a synchronous API. Nothing is skipped: Units are still encoded, sealed and verified.
 *
 * Lifted from giper/baza/crdtbench, wired by `$giper_baza_crdtbench_crypto`.
 */

const privates = new WeakMap()
const publics = new WeakMap()

const sign_sync = ( signer, data ) => {
	let key = privates.get( signer )
	if( key === undefined ) {
		key = crypto.createPrivateKey( {
			key: { kty: 'OKP', crv: 'Ed25519', x: signer.toString(), d: signer.toStringPrivate() },
			format: 'jwk',
		} )
		privates.set( signer, key )
	}
	return new Uint8Array( crypto.sign( null, data, key ) )
}

const verify_sync = ( auditor, data, sign ) => {
	let key = publics.get( auditor )
	if( key === undefined ) {
		key = crypto.createPublicKey( {
			key: { kty: 'OKP', crv: 'Ed25519', x: auditor.toString() },
			format: 'jwk',
		} )
		publics.set( auditor, key )
	}
	return crypto.verify( null, data, key, sign )
}

$.$giper_baza_crdtbench_crypto( sign_sync, verify_sync )

/*
 * A Baza Auth key is an Ed25519 pair plus an X25519 pair, and the public Ed25519 part must start
 * with 0xFF, because that byte is how a Pass is discriminated inside a Pack. So keys are found by
 * rejection sampling. Identity setup, not an editor cost, so the pool is prepared up front.
 */
const prepare_auths = count => {
	const auths = []
	while( auths.length < count ) {
		let jwk = null
		for( ;; ) {
			jwk = crypto.generateKeyPairSync( 'ed25519' ).privateKey.export( { format: 'jwk' } )
			if( Buffer.from( jwk.x, 'base64url' )[ 0 ] === 0xFF ) break
		}
		const cipher = crypto.generateKeyPairSync( 'x25519' ).privateKey.export( { format: 'jwk' } )
		const serial = jwk.x + cipher.x + jwk.d + cipher.d
		// Baza skips Lords whose id contains the base64ae specific letters.
		if( /[æÆ]/.test( $.$giper_baza_auth.from( serial ).pass().lord().str ) ) continue
		auths.push( serial )
	}
	$.$giper_baza_crdtbench.auths = auths
}

prepare_auths( 8 )

const bench = $.$$.$bog_wysiwyg_bench

bench.chars = Number( process.env.BENCH_CHARS ) || bench.chars
if( process.env.BENCH_SIZES ) bench.sizes = process.env.BENCH_SIZES.split( ',' ).map( Number )

bench.run()

process.exit( 0 )
