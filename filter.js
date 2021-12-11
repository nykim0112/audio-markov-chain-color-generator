// Song 
const marioSelected = document.getElementById('Mario')
const otherSelected = document.getElementById('Other1')

var songSelected;
var noteSequence;

TWINKLE_TWINKLE = {
    notes: [
        { pitch: 60, startTime: 0.0, endTime: 0.5 },
        { pitch: 60, startTime: 0.5, endTime: 1.0 },
        { pitch: 65, startTime: 1.0, endTime: 1.5 },
        { pitch: 67, startTime: 1.5, endTime: 2.0 },
        { pitch: 69, startTime: 2.0, endTime: 2.5 },
        { pitch: 69, startTime: 2.5, endTime: 3.0 },
        { pitch: 67, startTime: 3.0, endTime: 4.0 },
        { pitch: 65, startTime: 4.0, endTime: 4.5 },
        { pitch: 65, startTime: 4.5, endTime: 5.0 },
        { pitch: 64, startTime: 5.0, endTime: 5.5 },
        { pitch: 60, startTime: 5.5, endTime: 6.0 },
        { pitch: 65, startTime: 6.0, endTime: 6.5 },
        { pitch: 67, startTime: 6.5, endTime: 7.0 },
        { pitch: 60, startTime: 7.0, endTime: 8.0 },

        { pitch: 65, startTime: 8.0, endTime: 9.0 },
        { pitch: 65, startTime: 9.0, endTime: 10.0 },
        { pitch: 60, startTime: 10.0, endTime: 11.0 },
        { pitch: 65, startTime: 11.0, endTime: 12.0 },
        { pitch: 65, startTime: 12.0, endTime: 13.0 },
        { pitch: 64, startTime: 13.0, endTime: 14.0 },

    ],
    totalTime: 8
};

// MIDI to Note Sequence 


if (marioSelected.checked) {
    MIDItoNoteSequence('/mario.mid')
} else if (otherSelected.checked) {
    // otherSelected = 
} else {
    songPath = TWINKLE_TWINKLE
}

function MIDItoNoteSequence(songPath) {
    // convert Blob containing MIDI to a note sequence 

}


function generateTransitions(noteSequence) {
    // var n = document.getElementById("nOrder").value

    // var uniquePitches = TWINKLE_TWINKLE.notes.map(item => item.pitch).filter((value, index, self) => self.indexOf(value) === index)
    //     // for each unique pitch in song, determine transitions 
    // var matrix = new Array([]);
    // var pitchCols = new Array();
    // var pitchRows = new Array();

    // // for each note in the sequence 
    // for (var i = n; i < noteSequence.notes.length; i++) {
    //     var prev2 = noteSequence.notes[i - 2]
    //     var prev1 = noteSequence.notes[i - 1]
    //     var curr = noteSequence.notes[i]
    //     var currIndex; // corresponds to col
    //     var prevIndex; // corresponds to row


    //     // if pitch not in matrix, add pitch to list
    //     if (pitchCols.includes(curr.pitch) == false) {
    //         pitchCols.push(curr.pitch)
    //         console.log("MAKING NEW COL")
    //     }

    //     // which col
    //     currIndex = pitchCols.indexOf(curr.pitch);

    //     // determine if prev combo is in matrix
    //     if (pitchRows.includes(prev2.pitch + "," + prev1.pitch)) {
    //         // both exist, so add 1 to that element 
    //         console.log("PREV2 EXISTS")
    //         prevIndex = pitchRows.indexOf(prev2.pitch + "," + prev1.pitch)
    //         matrix[prevIndex][currIndex] = matrix[prevIndex][currIndex] + 1
    //     } else {
    //         // prev doesnt exist yet, make new row 
    //         console.log("MAKING NEW ROW");
    //         matrix.push([0]);
    //         pitchRows.push(prev2.pitch + "," + prev1.pitch)
    //         prevIndex = pitchRows.indexOf(prev2.pitch + "," + prev1.pitch)
    //         matrix[prevIndex][currIndex] = 1
    //     }

    //     console.log("curr index and prev are " + currIndex + prevIndex)
    //     console.log("current is " + JSON.stringify(curr))
    //     console.log("pitch rows are  " + JSON.stringify(pitchRows))
    //     console.log("pitch cols are  " + JSON.stringify(pitchCols))
    //     console.table(matrix)

    // }

    // console.log(JSON.stringify(matrix[0]))
    //     // then normalize matrix so rows sum to 1 
    // for (var i = 0; i < pitchRows.length; i++) {
    //     var rowSum = matrix[i].reduce(add, 0)
    //     console.log("rowSum = " + rowSum);

    //     // then divide each col by rowSum 
    //     for (var j = 0; j < pitchCols.length; j++) {
    //         console.log("initial val = " + matrix[i][j]);
    //         console.log("reducing and " + matrix[i][j] / rowSum)
    //         matrix[i][j] = matrix[i][j] / rowSum
    //     }
    // }
    // console.log('NEW MATRIX')
    // console.table(matrix)

    var n = parseInt(document.getElementById("nOrder").value);
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

    // console.table(transitionMatrix);

    for (var r = 0; r < prevNotegroups.length; r++) {
        var rowSum = transitionMatrix[r].reduce(add, 0);
        for (var c = 0; c < currNotegroups.length; c++) {
            transitionMatrix[r][c] = transitionMatrix[r][c] / rowSum;
        }

    }

    console.table(transitionMatrix);

}

function add(accumulator, a) {
    return accumulator + a;
}

function calculateNextNote(noteSequence) {

}

function playMarkov(song) {
    var transition_matrix = generateTransitions(song)
}

const playButton = document.querySelector('button');
playButton.addEventListener('click', function() {
    audioCtx = new(window.AudioContext || window.webkitAudioContext)

    generateTransitions(TWINKLE_TWINKLE);

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