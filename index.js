const button = document.getElementById('button')
button.onclick = () => {
  const audioContext = new window.AudioContext()
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    console.log('got media sources')
    // Create an AudioNode from the stream.
    const mediaStreamSource = audioContext.createMediaStreamSource(stream)
    // Create a new volume meter and connect it.
    const meter = createAudioMeter(audioContext)
    mediaStreamSource.connect(meter)
  }).catch((e) => {
    window.alert(`Error getting mic input: ${e}`)
  })
  button.style.display = 'none'
  document.body.innerText = 'Recording...'
}

