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

function generateTransitions(midi) {

    /*
    Generates transition matrix with given midi file
    */

    var midiNoteSequence = midi.tracks[0].notes; // array of notes and their properties (ex. duration)
    var nNotesGroups = new Array(); // array of n-note groups

    // iterate through to make groups of n notes and append to nNoteGroups
    for (var i = 0; i < midiNoteSequence.length - n; i++) {

        var nNote = new Array();

        for (var j = i; j < i + n + 1; j++) {
            nNote.push(midiNoteSequence[j].name);
        }
        nNotesGroups[i] = nNote;
    }

    // Iterate through nNotesGroups and populate prevNoteSeqs and currNoteSeqs

    var transitionMatrix = new Array();
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
        var row = currentNNotes.slice(0, -1).join();
        var col = currentNNotes.slice(-1).join("");

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

    return [prevNoteSeqs, currNoteSeqs, transitionMatrix];

}

// Helper function for normalizing transiton matrix
function add(accumulator, a) {
    return accumulator + a;
}

function calculateNextNotes(midi, lenOfSequence) {

    var newSequence = new Array(); // Sequence of new notes to be played;
    var midiNoteSequence = midi.tracks[0].notes; // array of notes and their properties (ex. duration)

    // Split return value of generateTransitions into three diff variables
    var transitionMatrix_calc = generateTransitions(midi);
    var prevNotegroups = transitionMatrix_calc[0];
    var currNotegroups = transitionMatrix_calc[1];
    var transitionMatrix = transitionMatrix_calc[2];

    // Take the first n notes from the midi file to newSequence
    for (var i = 0; i < n; i++) {
        newSequence.push(midiNoteSequence[i].name);
    }

    // Generate next lenOfSequence number of notes with transition matrix
    for (var i = 0; i < lenOfSequence - 2; i++) {

        var currIdx = newSequence.length; // index of currently generated note
        var prevNotes = newSequence.slice(newIdx - n, newIdx);
        var prevNoteSeq = new Array();

        // Append previous pitches to find them within prevNotegroups
        for (var k = 0; k < n; k++) {
            prevNoteSeq.push(prevNotes[k].name);
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

            if (randomProb < 0) {
                newSequence.push(Tone.frequencu(currNotegroups[j])); // MODIFY HERE TO CHANGE FORMAT OF 
                break;
            }
        }

    }

    return newSequence;

}

function playMarkov(midi) {

    var noteSequence = calculateNextNotes(midi, numOfNotes);

    noteSequence.forEach(note => {
        playNote(note);
    });

}