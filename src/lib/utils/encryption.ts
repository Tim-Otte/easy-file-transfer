import _sodium from 'libsodium-wrappers';

export type EncryptedMessage = { encrypted: string, nonce: string };

export async function waitForSodium() {
    await _sodium.ready;
}

export type KeyPair = _sodium.KeyPair;
export type KeyExchange = _sodium.CryptoKX;

export class Base64 {
    static fromUint8Array(data: Uint8Array) {
        return _sodium.to_base64(data, _sodium.base64_variants.URLSAFE_NO_PADDING);
    }

    static toUint8Array(text: string) {
        return _sodium.from_base64(text, _sodium.base64_variants.URLSAFE_NO_PADDING);
    }
}

export class ChaCha20_Poly1305 {
    static generateEncryptionKey(sharedKey: Uint8Array, sharedSecret: Uint8Array) {
        const hashedSecret = _sodium.crypto_generichash(64, sharedSecret);
        return _sodium.crypto_generichash(32, hashedSecret, sharedKey);
    }

    static encrypt(key: Uint8Array, text: string): EncryptedMessage {
        const encodedText = new TextEncoder().encode(text);

        const nonce = _sodium.randombytes_buf(_sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
        const encrypted = _sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
            encodedText,
            null,
            null,
            nonce,
            key
        );

        return { encrypted: Base64.fromUint8Array(encrypted), nonce: Base64.fromUint8Array(nonce) };
    }

    static decrypt(key: Uint8Array, encryptedMessage: EncryptedMessage) {
        const decrypted = _sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
            null,
            Base64.toUint8Array(encryptedMessage.encrypted),
            null,
            Base64.toUint8Array(encryptedMessage.nonce),
            key
        );

        return new TextDecoder().decode(decrypted);
    }
}

export class X25519 {
    static generateSharedSecret() {
        return crypto.getRandomValues(new Uint8Array(32));
    }

    static generateKeyPair() {
        return _sodium.crypto_kx_keypair();
    }

    static deriveBitsForClient(remotePublicKey: Uint8Array, localKeypair: KeyPair) {
        return _sodium.crypto_kx_client_session_keys(
            localKeypair.publicKey,
            localKeypair.privateKey,
            remotePublicKey
        );
    }

    static deriveBitsForServer(remotePublicKey: Uint8Array, localKeypair: KeyPair) {
        return _sodium.crypto_kx_server_session_keys(
            localKeypair.publicKey,
            localKeypair.privateKey,
            remotePublicKey
        );
    }
}