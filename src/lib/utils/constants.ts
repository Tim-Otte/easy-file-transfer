/**
  * The size of the chunks sent via WebRTC (in KB)
  */
const CHUNK_SIZE = 14 * 1024;

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
const PING_TIMEOUT = 1000;

export { CHUNK_SIZE, CONTROL_CHANNEL_LABEL, FILE_CHANNEL_LABEL, PING_TIMEOUT };

