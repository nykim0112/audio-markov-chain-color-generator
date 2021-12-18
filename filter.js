//import * as Tone from 'tone';

var file = document.getElementById("file");
const uploadBtn = document.getElementById("uploadFile");
const playButton = document.getElementById('play');
const resetButton = document.getElementById('reset');
var n = parseInt(document.getElementById("nOrder").value);
var numOfNotes = parseInt(document.getElementById("numOfNotes").value);

const midi = new Midi();
var currentMidi;

var audioCtx;
var songSelected;
// var noteSequence;

TWINKLE_TWINKLE = {
    notes: [
        { pitch: 60, startTime: 0.0, endTime: 0.5 },
        { pitch: 60, startTime: 0.5, endTime: 1.0 },
        { pitch: 67, startTime: 1.0, endTime: 1.5 },
        { pitch: 67, startTime: 1.5, endTime: 2.0 },
        { pitch: 69, startTime: 2.0, endTime: 2.5 },
        { pitch: 69, startTime: 2.5, endTime: 3.0 },
        { pitch: 67, startTime: 3.0, endTime: 4.0 },
        { pitch: 65, startTime: 4.0, endTime: 4.5 },
        { pitch: 65, startTime: 4.5, endTime: 5.0 },
        { pitch: 64, startTime: 5.0, endTime: 5.5 },
        { pitch: 64, startTime: 5.5, endTime: 6.0 },
        { pitch: 62, startTime: 6.0, endTime: 6.5 },
        { pitch: 62, startTime: 6.5, endTime: 7.0 },
        { pitch: 60, startTime: 7.0, endTime: 8.0 },
    ],
    totalTime: 8
};

function parseFile(file) {

    /*
    Sets JSON-file MIDI to currentMidi
    */

    const reader = new FileReader();
    reader.onload = function(e) {
        const parsedMidi = new Midi(e.target.result);
        document.querySelector("#ResultsText").value = JSON.stringify(parsedMidi, undefined, 2);

        currentMidi = parsedMidi;
    };
    reader.readAsArrayBuffer(file);
}



function generateTransitions(midiNoteSequence) {

    /*
    Generates transition matrix with given midi file
    */

    var nNotesGroups = new Array(); // array of n-note groups
    console.log("length " + midiNoteSequence.length)

    // iterate through to make groups of n notes and append to nNoteGroups
    for (var i = 0; i < midiNoteSequence.length - n; i++) {

        var nNote = new Array();


        for (var j = i; j < i + n + 1; j++) {
            nNote.push(midiNoteSequence[j].midi);
        }
        nNotesGroups[i] = nNote;
    }

    // Iterate through nNotesGroups and populate prevNoteSeqs and currNoteSeqs

    // var transitionMatrix = new Array();
    var prevNoteSeqs = new Array();
    var currNoteSeqs = new Array();

    for (var i = 0; i < nNotesGroups.length; i++) {

        var currentNNotes = nNotesGroups[i];
        var row = currentNNotes.slice(0, -1).join();
        var col = currentNNotes.slice(-1).join("");

        // row
        if (prevNoteSeqs.includes(row) == false) {
            prevNoteSeqs.push(row);
        }

        // col
        if (currNoteSeqs.includes(col) == false) {
            currNoteSeqs.push(col);
        }

    }

    // Iterate through nNotesGroups again to populate the transition matrix

    var transitionMatrix = Array(prevNoteSeqs.length).fill().map(() => Array(currNoteSeqs.length).fill(0));

    for (var i = 0; i < nNotesGroups.length; i++) {

        var currNoteSeq = nNotesGroups[i];
        var row = currNoteSeq.slice(0, -1).join();
        var col = currNoteSeq.slice(-1).join("");

        var rowIdx = prevNoteSeqs.indexOf(row);
        var colIdx = currNoteSeqs.indexOf(col);

        transitionMatrix[rowIdx][colIdx]++;
    }

    // Normalize the matrix

    for (var r = 0; r < prevNoteSeqs.length; r++) {
        var rowSum = transitionMatrix[r].reduce(add, 0);
        for (var c = 0; c < currNoteSeqs.length; c++) {
            transitionMatrix[r][c] = transitionMatrix[r][c] / rowSum;
        }
    }

    console.table(transitionMatrix);

    return [prevNoteSeqs, currNoteSeqs, transitionMatrix];

}

// Helper function for normalizing transiton matrix
function add(accumulator, a) {
    return accumulator + a;
}

function calculateNextNotes(chorusSequence, lenOfSequence) {

    var newSequence = new Array(); // Sequence of new notes to be played;

    // Split return value of generateTransitions into three diff variables
    var transitionMatrix_calc = generateTransitions(chorusSequence);
    var prevNotegroups = transitionMatrix_calc[0];
    var currNotegroups = transitionMatrix_calc[1];
    var transitionMatrix = transitionMatrix_calc[2];

    var currentTime = 0;


    // Take the first n notes from the midi file to newSequence
    for (var i = 0; i < n; i++) {
        newSequence.push({ midi: chorusSequence[i].midi, startTime: currentTime, endTime: currentTime + chorusSequence[i].duration })
        currentTime += chorusSequence[i].duration;
    }

    // Generate next lenOfSequence number of notes with transition matrix
    for (var i = 0; i < lenOfSequence - 2; i++) {

        var currIdx = newSequence.length; // index of currently generated note
        var prevNotes = newSequence.slice(currIdx - n, currIdx);
        var prevNoteSeq = new Array();

        // Append previous pitches to find them within prevNotegroups
        for (var k = 0; k < n; k++) {
            prevNoteSeq.push(prevNotes[k].midi);
        }

        // Find the previous n note sequence in the row
        var prevNoteSeqToStr = prevNoteSeq.join();
        var currRowIdx = prevNotegroups.indexOf(prevNoteSeqToStr);

        // If the sequence cannot be found, go with the first row
        if (currRowIdx == -1) {
            currRowIdx = 0;
        }

        // Weighted random selection
        var probabilities = transitionMatrix[currRowIdx];
        var randomProb = Math.random();

        for (var j = 0; j < currNotegroups.length; j++) {
            randomProb -= probabilities[j];

            console.log("current note group is " + JSON.stringify(currNotegroups[j]))
            if (randomProb < 0) {
                newSequence.push({ midi: currNotegroups[j], startTime: currentTime, endTime: currentTime + chorusSequence[j].duration }); // MODIFY HERE TO CHANGE FORMAT OF 
                currentTime += chorusSequence[j].duration;
                break;
            }
        }

    }

    console.log(newSequence);

    return newSequence;

}

function playMarkov(midi) {

    // Determine which track to use 
    var trackNameNumber = {}
    var trackNo; 

    for(var i = 0; i < midi.tracks.length; i ++){
        //console.log("track is " + JSON.stringify(midi.tracks[i]))
        if(midi.tracks[i].instrument.name != "" && midi.tracks[i].notes  != []){
            trackNameNumber[midi.tracks[i].instrument.name] = trackNo
        }
    } 

    // somehow present the keys in trackNameNumber, then user selects 
    // get the value for the instrument name 

    // hardcoding...
    trackNo = 0; 

    // Get chorus 
    var chorusSequence = getChorus(midi.tracks[trackNo].notes)

    var noteSequence = calculateNextNotes(chorusSequence, numOfNotes);

    noteSequence.forEach(note => {
        console.log("note is " + JSON.stringify(note))
        playNote(note);
    });

}

function midiToFreq(m) {
    return Math.pow(2, (m - 69) / 12) * 440;
}

function playNote(note) {

    var activeOscillators = [];

    offset = 1; //it takes a bit of time to queue all these events

    const additiveOscillatorCount = 5; // Number of oscillators in Additive Synthesis

    var gainNode = audioCtx.createGain();

    //  TODO: map frequency with color and create dynamic gradient 
    for (var i = 0; i < additiveOscillatorCount; i++) {
        const additiveOsc = audioCtx.createOscillator();
        console.log("this is " + Tone.Frequency(note.midi, "midi"))
        additiveOsc.frequency.value = Tone.Frequency(note.midi, "midi");
        additiveOsc.connect(gainNode);
        activeOscillators.push(additiveOsc);
    }

    for (var i = 0; i < additiveOscillatorCount; i++) {
        activeOscillators[i].start();
    }

    // Envelope

    gainNode.connect(audioCtx.destination);

    gainNode.gain.value = 0;
    gainNode.gain.setTargetAtTime(0.2, note.startTime + offset, 0.05);
    gainNode.gain.setTargetAtTime(0.1, note.startTime + offset + 0.2, 0.05);
    gainNode.gain.setTargetAtTime(0, note.endTime + offset - 0.1, 0.01);

}

playButton.addEventListener('click', function() {

    if (!audioCtx) {

        audioCtx = new(window.AudioContext || window.webkitAudioContext);
        playButton.innerHTML = "Pause";

        //console.log("current midi is " + JSON.stringify(currentMidi))
        // generateTransitions(currentMidi);
        playMarkov(currentMidi);
        return;
    }

    if (audioCtx.state === 'suspended') {
        playButton.innerHTML = "Pause";
        audioCtx.resume();
    }

    if (audioCtx.state === 'running') {
        playButton.innerHTML = "Play";
        audioCtx.suspend();
    }

}, false);

resetButton.addEventListener('click', function() {

    if (audioCtx) {
        audioCtx.close();
        audioCtx = false;

        playButton.innerHTML = "Play";
        return;
    }

}, false);

uploadBtn.addEventListener("click", function() {
    file.click();
});

file.addEventListener("change", (e) => {
    console.log("file added: " + file.value)

    //get the files
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        parseFile(file)
    }
});