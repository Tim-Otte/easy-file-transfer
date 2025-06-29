# Easy File Transfer

Easy File Transfer is a web-based peer-to-peer file sharing application that enables fast, secure, and privacy-friendly file transfers directly between devices using WebRTC and end-to-end encryption.

## Features

- 🚀 **Peer-to-peer file transfers** using WebRTC data channels
- 🔒 **End-to-end encryption** with X25519 and ChaCha20-Poly1305
- 🗂️ **Multiple file uploads** with progress and speed indicators
- 📦 **Automatic compression** using gzip for efficient transfers
- 🔗 **Shareable links** for easy connection between sender and receiver
- 🌐 **No server-side file storage** - the server only relays signaling messages
- 🖥️ **Modern UI** built with SvelteKit and Tailwind CSS
- 🏷️ **File type icons** and queue management

## How It Works

1. **Sender** uploads files and receives a shareable link.
2. **Receiver** opens the link, establishing a secure WebRTC connection.
3. Files are transferred directly, encrypted, and compressed.

## Project Structure

- [`src/routes/+page.svelte`](src/routes/+page.svelte): Main upload page (sender)
- [`src/routes/receive/+page.svelte`](src/routes/receive/+page.svelte): Download page (receiver)
- [`src/lib/webrtc/`](src/lib/webrtc/): WebRTC connection and signaling logic
- [`src/lib/file-transfer/`](src/lib/file-transfer/): File transfer, compression, and hashing utilities
- [`src/lib/components/`](src/lib/components/): UI components
- [`src/websocket/signaling-server.ts`](src/websocket/signaling-server.ts): WebSocket signaling server

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/) (recommended)

### Development

```sh
pnpm run dev --open
```

This starts the SvelteKit dev server and the local signaling server.

### Production Build

```sh
pnpm build
pnpm preview
```

Or use Docker:

```sh
docker build -t easy-file-transfer .
docker run -p 3000:3000 easy-file-transfer
```

## Security
- All file data is encrypted in transit using [libsodium](https://libsodium.gitbook.io/doc/).
- Only signaling metadata passes through the server; files are never stored server-side.