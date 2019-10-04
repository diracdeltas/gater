const gate = 0.03 // TODO: make this adjustable
const bufSize = 10

/**
 * Create a circular buffer of length n
 */
function CircularBuffer (n) {
  this.max_length = n
  this.array = []
}
CircularBuffer.prototype.add = function (item) {
  // adds an element to the buffer
  this.array.push(item)
  if (this.array.length > this.max_length) {
    // remove first item of array
    this.array.shift()
  }
}
CircularBuffer.prototype.average = function () {
  // returns average of values in the buffer
  return this.array.reduce((a, b) => a + b, 0) / this.array.length
}

class MicProcessor extends AudioWorkletProcessor {
  process (inputs, outputs, parameters) {
    const channels = inputs[0]
    this.volumeBuffer = new CircularBuffer(bufSize)
    this.volumeAudioProcess(channels)
    return true
  }

  volumeAudioProcess (channels) {
    // assume stereo
    const buf1 = channels[0]
    const buf2 = channels[1]
    const volume = rms(buf1, buf2)
    this.volumeBuffer.add(volume)
    if (this.volumeBuffer.average() > gate) {
      chunk.channel1.push(buf1)
      chunk.channel2.push(buf2)
    } else {
      if (chunk.channel1.length > bufSize) {
        this.port.postMessage(chunk)
      }
      chunk.channel1 = []
      chunk.channel2 = []
    }
  }
}

const chunk = {
  channel1: [],
  channel2: []
}

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
