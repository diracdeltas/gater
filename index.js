const button = document.getElementById('button')
button.onclick = () => {
  const audioContext = new window.AudioContext()
  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      googEchoCancellation: false,
      googAutoGainControl: false,
      googAutoGainControl2: false,
      googNoiseSuppression: false,
      googHighpassFilter: false,
      googTypingNoiseDetection: false
    }
  }).then(async (stream) => {
    console.log('got media sources')
    // Create an AudioNode from the stream.
    const mediaStreamSource = audioContext.createMediaStreamSource(stream)
    // Create a new volume meter and connect it.
    const meter = await createAudioMeter(audioContext)
    mediaStreamSource.connect(meter)
  }).catch((e) => {
    document.getElementById('status').innerText =
      `Error getting mic input: ${e}`
  })
  button.style.display = 'none'
  document.getElementById('status').innerText = 'Recording...'
}
