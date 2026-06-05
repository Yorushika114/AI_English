// AudioWorklet processor — runs in a dedicated audio thread
// Converts Float32 microphone samples to Int16 PCM and posts 1280-byte chunks
// (40ms at 16kHz 16bit mono, matching iFlytek STT frame size)
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buf = []
  }

  process(inputs) {
    const ch = inputs[0]?.[0]
    if (!ch) return true

    for (let i = 0; i < ch.length; i++) {
      // Clamp and convert Float32 [-1,1] → Int16
      this._buf.push(Math.max(-32768, Math.min(32767, ch[i] * 32767 | 0)))
    }

    // 640 Int16 samples = 1280 bytes = one iFlytek frame
    while (this._buf.length >= 640) {
      const int16 = new Int16Array(this._buf.splice(0, 640))
      this.port.postMessage(int16.buffer, [int16.buffer])
    }

    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)
