// Song 
const marioSelected = document.getElementById('Mario');
const otherSelected = document.getElementById('Other1');
var n = parseInt(document.getElementById("nOrder").value);

var songSelected;
var noteSequence;

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

// MIDI to Note Sequence 


if (marioSelected.checked) {
    MIDItoNoteSequence('/mario.mid')
} else if (otherSelected.checked) {
    // otherSelected = 
} else {
    songPath = TWINKLE_TWINKLE;
}

function MIDItoNoteSequence(songPath) {
    // convert Blob containing MIDI to a note sequence 
}


function generateTransitions(noteSequence) {

    var noteGroups = new Array();

    for (var i = 0; i < noteSequence.notes.length - n; i++) {
        var noteseq = new Array();

        for (var j = i; j < i + n + 1; j++) {
            // console.log(i, i + n + 1, j);
            noteseq.push(noteSequence.notes[j].pitch);
        }
        noteGroups[i] = noteseq;
    }

    // console.log("Note sequence added: " + noteGroups);

    // var transitionMatrix = new Array();
    var prevNotegroups = new Array();
    var currNotegroups = new Array();

    for (var i = 0; i < noteGroups.length; i++) {
        var currNoteseq = noteGroups[i];
        var row = currNoteseq.slice(0, -1).join(); // string
        var col = currNoteseq.slice(-1).join(''); // string

        // Row
        if (prevNotegroups.includes(row) == false) {
            prevNotegroups.push(row);
        }

        // Col
        if (currNotegroups.includes(col) == false) {
            currNotegroups.push(col);
        }
    }

    var transitionMatrix = Array(prevNotegroups.length).fill().map(() => Array(currNotegroups.length).fill(0));

    for (var i = 0; i < noteGroups.length; i++) {
        var currNoteseq = noteGroups[i];
        var row = currNoteseq.slice(0, -1).join(); // string
        var col = currNoteseq.slice(-1).join(''); // string

        var rowIdx = prevNotegroups.indexOf(row);
        var colIdx = currNotegroups.indexOf(col);

        transitionMatrix[rowIdx][colIdx]++;
    }

    for (var r = 0; r < prevNotegroups.length; r++) {
        var rowSum = transitionMatrix[r].reduce(add, 0);
        for (var c = 0; c < currNotegroups.length; c++) {
            transitionMatrix[r][c] = transitionMatrix[r][c] / rowSum;
        }
    }

    return [prevNotegroups, currNotegroups, transitionMatrix];

}

function add(accumulator, a) {
    return accumulator + a;
}

function calculateNextNotes(ns, numOfNotes = 50) {

    var noteSequence = ns;

    var transitionMatrix_calc = generateTransitions(noteSequence);
    var prevNotegroups = transitionMatrix_calc[0];
    var currNotegroups = transitionMatrix_calc[1];
    var transitionMatrix = transitionMatrix_calc[2];

    for (var i = 0; i < numOfNotes; i++) {

        var newIdx = noteSequence.notes.length;
        var prevNotes = noteSequence.notes.slice(newIdx - n, newIdx);
        var prevPitches = new Array();

        for (var k = 0; k < n; k++) {
            prevPitches.push(prevNotes[k].pitch);
        }

        prevNotes = prevPitches.join();

        var currRowIdx = prevNotegroups.indexOf(prevNotes);

        if (currRowIdx == -1) {
            currRowIdx = 0;
        }

        console.log(currRowIdx);

        var probability = transitionMatrix[currRowIdx];
        var random = Math.random();

        for (var j = 0; j < currNotegroups.length; j++) {
            random -= probability[j];

            if (random < 0) {
                noteSequence.notes.push({ pitch: parseInt(currNotegroups[j]), startTime: noteSequence.totalTime, endTime: noteSequence.totalTime + 0.5 });
                noteSequence.totalTime = noteSequence.totalTime + 0.5;
                break;
            }
        }
    }
    return noteSequence;

}

function playMarkov(ns) {
    var noteSequence = calculateNextNotes(ns);
    console.log(noteSequence);

    console.log(noteSequence.notes);
    noteSequence.notes.forEach(note => {
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
    // var gainCount = 1; // Number of notes playing simultaneously/pressed down

    var gainNode = audioCtx.createGain();

    for (var i = 0; i < additiveOscillatorCount; i++) {
        const additiveOsc = audioCtx.createOscillator();
        // additiveOsc.frequency.value = midiToFreq(note.pitch) + Math.random() * 15;
        additiveOsc.frequency.value = midiToFreq(note.pitch);
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
    gainNode.gain.setTargetAtTime(0.1, note.startTime + offset + 0.1, 0.05);
    gainNode.gain.setTargetAtTime(0, note.endTime + offset - 0.05, 0.01);

}

const playButton = document.querySelector('button');
playButton.addEventListener('click', function() {
    audioCtx = new(window.AudioContext || window.webkitAudioContext);

    playMarkov(TWINKLE_TWINKLE);

}, false);

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