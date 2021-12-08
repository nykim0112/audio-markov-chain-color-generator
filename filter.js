const audioCtx = new(window.AudioContext || window.webkitAudioContext);

if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ "audio": true }).then((stream) => {
        const microphone = audioCtx.createMediaStreamSource(stream);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.5;
        microphone.connect(gainNode).connect(audioCtx.destination);
    }).catch((err) => {
        console.log("ERROR: Unable to access microphone.");
        console.log(err);
        // browser unable to access microphone
        // (check to see if microphone is attached)
    });
} else {
    console.log("ERROR: Unable to access media devices.");
    // browser unable to access media devices
    // (update your browser)
}