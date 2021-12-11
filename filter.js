import { Midi } from '@tonejs/midi'
const midi = new Midi() 

const audioCtx = new(window.AudioContext || window.webkitAudioContext);

// Song 
const marioSelected = document.getElementById('Mario')
const otherSelected = document.getElementById('Other1')

var songSelected; 
var noteSequence; 


// MIDI to Note Sequence 


if (marioSelected.checked){
    MIDItoNoteSequence('/mario.mid')
}else if(otherSelected.checked){
    otherSelected = 
}

function MIDItoNoteSequence(songPath){
    // convert Blob containing MIDI to a note sequence 
    noteSequence = blobToNoteSequence()

}

function nOrder(){
    
}
function generateTransitions(n){

}

function calculateNextNote(noteSequence){

}

/*
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
}*/

