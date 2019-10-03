class MicProcessor extends AudioWorkletProcessor {
  process (inputs, outputs, parameters) {
    const channels = inputs[0]
    this.volumeAudioProcess(channels)
    return true
  }

  volumeAudioProcess (channels) {
    // assume stereo
    const buf1 = channels[0]
    const buf2 = channels[1]
    const prevVolume = volume
    volume = rms(buf1, buf2)
    if (volume > gate && prevVolume > gate) {
      // part of a contiguous chunk
      chunk.channel1.push(buf1)
      chunk.channel2.push(buf2)
    } else {
      if (chunk.channel1.length || chunk.channel2.length) {
        this.port.postMessage(chunk)
      }
      chunk.channel1 = []
      chunk.channel2 = []
    }
  }
}

const gate = 0.05 // TODO: make this adjustable
const chunk = {
  channel1: [],
  channel2: []
}
let volume = 0

function rms (buf1, buf2) {
  const sum = squareSum(buf1) + squareSum(buf2)
  return Math.sqrt(sum / (buf1.length + buf2.length))
}

function squareSum (buf) {
  let sum = 0
  for (let i = 0; i < buf.length; i++) {
    let x = buf[i]
    sum += x * x
  }
  return sum
}

registerProcessor('mic-processor', MicProcessor)
