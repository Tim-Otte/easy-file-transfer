/**
 * The compression algorithm used for file transfers
 */
const COMPRESSION_ALGORITHM = 'gzip';

/**
 * The label of the control channel
 */
const CONTROL_CHANNEL_LABEL = 'controlChannel';

/**
 * The label of the file channel
 */
const FILE_CHANNEL_LABEL = 'fileChannel';

/**
 * Time (in ms) to wait between pings
 */
const PING_TIMEOUT = 1500;

/**
 * Timeout (in ms) for reconnecting the signaling channel
 */
const SIGNALING_CHANNEL_RECONNECT_TIMEOUT = 5000;

export { COMPRESSION_ALGORITHM, CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL, PING_TIMEOUT, SIGNALING_CHANNEL_RECONNECT_TIMEOUT };

