import _sodium from 'libsodium-wrappers';

export interface EncryptedMessage { encrypted: string, nonce: string };

export async function waitForSodium(): Promise<void> {
    await _sodium.ready;
}

export type KeyPair = _sodium.KeyPair;
export type KeyExchange = _sodium.CryptoKX;
export type HashState = _sodium.StateAddress;

export class Base64 {
    static fromUint8Array(data: Uint8Array): string {
        return _sodium.to_base64(data, _sodium.base64_variants.URLSAFE_NO_PADDING);
    }

    static toUint8Array(text: string): Uint8Array {
        return _sodium.from_base64(text, _sodium.base64_variants.URLSAFE_NO_PADDING);
    }
}

export class ChaCha20_Poly1305 {
    static generateEncryptionKey(sharedKey: Uint8Array, sharedSecret: Uint8Array): Uint8Array {
        const hashedSecret = _sodium.crypto_generichash(64, sharedSecret);
        return _sodium.crypto_generichash(32, hashedSecret, sharedKey);
    }

    static encrypt(key: Uint8Array, data: Uint8Array): Uint8Array {
        const nonce = _sodium.randombytes_buf(_sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
        const encrypted = _sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
            data,
            null,
            null,
            nonce,
            key
        );

        const result = new Uint8Array(nonce.length + encrypted.length);
        result.set(nonce);
        result.set(encrypted, nonce.length);

        return result;
    }

    static decrypt(key: Uint8Array, encryptedMessage: Uint8Array): Uint8Array {
        const nonce = new Uint8Array(encryptedMessage.slice(0, _sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));
        const ciphertext = new Uint8Array(encryptedMessage.slice(_sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES));

        return _sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
            null,
            ciphertext,
            null,
            nonce,
            key
        );
    }
}

export class X25519 {
    static generateSharedSecret(): Uint8Array {
        return _sodium.randombytes_buf(32);
    }

    static generateKeyPair(): KeyPair {
        return _sodium.crypto_kx_keypair();
    }

    static deriveBitsForClient(remotePublicKey: Uint8Array, localKeypair: KeyPair): KeyExchange {
        return _sodium.crypto_kx_client_session_keys(
            localKeypair.publicKey,
            localKeypair.privateKey,
            remotePublicKey
        );
    }

    static deriveBitsForServer(remotePublicKey: Uint8Array, localKeypair: KeyPair): KeyExchange {
        return _sodium.crypto_kx_server_session_keys(
            localKeypair.publicKey,
            localKeypair.privateKey,
            remotePublicKey
        );
    }
}

export class Hashing {
    static init(): HashState {
        return _sodium.crypto_generichash_init(null, 16);
    }

    static update(state: HashState, data: Uint8Array): void {
        _sodium.crypto_generichash_update(state, data);
    }

    static finalize(state: HashState): string {
        return _sodium.to_hex(_sodium.crypto_generichash_final(state, 16));
    }
}