async function createAudioMeter (audioContext) {
  await audioContext.audioWorklet.addModule('workers/micProcessor.js')
  const node = new window.AudioWorkletNode(audioContext, 'mic-processor')
  node.port.onmessage = (e) => {
    const chunk = e.data
    // send the channel data from our buffer to the worker
    console.log(`exporting at samplerate ${sampleRate}`, chunk)
    // ask the worker for a WAV
    worker.postMessage({
      command: 'exportWAV',
      buffer: chunk,
      type: 'audio/wav'
    })
  }
  node.connect(audioContext.destination)
  return node
}

const sampleRate = 44100
var worker = new window.Worker('./workers/recorderWorker.js')
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
