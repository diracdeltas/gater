/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson
modified by azuki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

function createAudioMeter (audioContext, averaging) {
  const processor = audioContext.createScriptProcessor(8192 * 2, 2, 2)
  processor.onaudioprocess = volumeAudioProcess
  processor.volume = 0
  processor.averaging = averaging || 0.95

  // this will have no effect, since we don't copy the input to the output,
  // but works around a current Chrome bug.
  processor.connect(audioContext.destination)

  processor.shutdown = function () {
    this.disconnect()
    this.onaudioprocess = null
  }

  return processor
}

function squareSum (buf) {
  let sum = 0
  for (let i = 0; i < buf.length; i++) {
    let x = buf[i]
    sum += x * x
  }
  return sum
}

const gate = 0.01 // TODO: make this adjustable
const chunk = {
  channel1: [],
  channel2: []
}

let sampleRate = 44100

var worker = new window.Worker('./recorder/recorderWorker.js')
// initialize the new worker
worker.postMessage({
  command: 'init',
  config: { sampleRate }
})
// callback for `exportWAV`
worker.onmessage = function (e) {
  const blob = e.data
  const url = URL.createObjectURL(blob)
  const au = document.createElement('audio')
  const li = document.createElement('li')
  const link = document.createElement('a')
  // add controls to the <audio> element
  au.controls = true
  au.src = url
  // link the a element to the blob
  link.href = url
  link.download = new Date().toISOString() + '.wav'
  link.innerHTML = link.download
  // add the new audio and a elements to the li element
  li.appendChild(au)
  li.appendChild(link)
  // add the li element to the ordered list
  document.getElementById('list').appendChild(li)
}

function createWav () {
  // send the channel data from our buffer to the worker
  console.log(`exporting at samplerate ${sampleRate}`, chunk)
  // ask the worker for a WAV
  worker.postMessage({
    command: 'exportWAV',
    buffer: chunk,
    type: 'audio/wav'
  })
}

function volumeAudioProcess (event) {
  // assume stereo
  const buf1 = event.inputBuffer.getChannelData(0)
  const buf2 = event.inputBuffer.getChannelData(1)
  sampleRate = event.inputBuffer.sampleRate
  const sum = squareSum(buf1) + squareSum(buf2)
  const rms = Math.sqrt(sum / (buf1.length + buf2.length))
  const prevVolume = this.volume
  this.volume = rms // Math.max(rms, this.volume * this.averaging)
  if (this.volume > gate && prevVolume > gate) {
    // part of a contiguous chunk
    chunk.channel1.push(buf1)
    chunk.channel2.push(buf2)
  } else {
    if (chunk.channel1.length || chunk.channel2.length) {
      // write chunk to a wav and clear it
      createWav()
    }
    chunk.channel1 = []
    chunk.channel2 = []
  }
}
