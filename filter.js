import { GlowParticle } from './glowparticle.js';

var file = document.getElementById("file");
const control_panel = document.getElementById("control_panel");
const uploadBtn = document.getElementById("uploadFile");
const playButton = document.getElementById('play');
const resetButton = document.getElementById('reset');
var n = parseInt(document.getElementById("nOrder").value);
var numOfNotes = parseInt(document.getElementById("numOfNotes").value);
var additiveSynth = document.getElementById("additive-synth").checked;
var selectedTrack;

const midi = new Midi();
var currentMidi;

var trackNo;
var audioCtx;
var trackNameNumber;
var colorscreen;

// MAPPING OF PITCH TO COLOR 
const PITCH_TO_COLOR = {
    'C': { r: 250, g: 15, b: 40 }, // red
    'G': { r: 255, g: 140, b: 0 }, //orange
    'D': { r: 255, g: 255, b: 0 }, // yellow 
    'A': { r: 0, g: 138, b: 0 }, // green 
    'E': { r: 135, g: 206, b: 250 }, // light blue 
    'B': { r: 224, g: 255, b: 255 }, // whitish blue 
    'F#': { r: 25, g: 25, b: 112 }, // blue saturated  
    'Gb': { r: 25, g: 25, b: 112 }, // blue saturated  
    'Db': { r: 238, g: 130, b: 238 }, // violet 
    'C#': { r: 238, g: 130, b: 238 }, // violet 
    'Ab': { r: 128, g: 0, b: 128 }, // purple 
    'G#': { r: 128, g: 0, b: 128 }, // purple 
    'Eb': { r: 0, g: 0, b: 139 }, // dark blue 
    'D#': { r: 0, g: 0, b: 139 }, // dark blue 
    'Bb': { r: 211, g: 211, b: 211 }, // gray  
    'A#': { r: 211, g: 211, b: 211 }, // gray  
    'F': { r: 139, g: 0, b: 0 } // dark red 
}

// COLORS TO BE DISPLAYED
var COLORS = [];

function parseFile(file) {

    /*
    Sets JSON-file MIDI to currentMidi
    */

    const reader = new FileReader();
    reader.onload = function(e) {
        const parsedMidi = new Midi(e.target.result);

        currentMidi = parsedMidi;

        // Determine which track to use 
        trackNameNumber = {}

        for (var i = 0; i < currentMidi.tracks.length; i++) {
            if (currentMidi.tracks[i].instrument.name != "" && currentMidi.tracks[i].notes.length != 0) {
                trackNameNumber[currentMidi.tracks[i].instrument.name] = i;
            }
        }

        // present the keys in trackNameNumber, then user selects 
        // get the value for the instrument name 

        var existing_trackSelectionPanel = document.getElementById("trackSelection");

        if (existing_trackSelectionPanel) {
            existing_trackSelectionPanel.remove();
        }

        var trackSelectionPanel = document.createElement("div");
        trackSelectionPanel.classList.add('col-md', 'p-3', 'm-2');
        trackSelectionPanel.id = "trackSelection";

        var trackSelectionPanel_header = document.createElement('h6');
        trackSelectionPanel_header.innerHTML = "Select a track:";
        trackSelectionPanel.appendChild(trackSelectionPanel_header);

        Object.keys(trackNameNumber).forEach(function(trackName) {
            var selection = document.createElement('div');
            var radioButton = document.createElement('input');
            var label = document.createElement('label');

            radioButton.type = "Radio";
            radioButton.name = "track";
            radioButton.id = trackName;
            selection.appendChild(radioButton);

            label.htmlFor = trackName;
            label.innerHTML = trackName;
            selection.appendChild(label);

            trackSelectionPanel.appendChild(selection);
        });

        control_panel.appendChild(trackSelectionPanel);

        var tracks = document.getElementsByName('track'); // get all radio buttons
        tracks[0].checked = "checked";
        selectedTrack = document.querySelector('input[name="track"]:checked');

    };
    reader.readAsArrayBuffer(file);


}

function generateTransitions(midiNoteSequence) {

    /*
    Generates transition matrix with given midi file
    */

    var nNotesGroups = new Array(); // array of n-note groups

    // iterate through to make groups of n notes and append to nNoteGroups
    for (var i = 0; i < midiNoteSequence.length - n; i++) {

        var nNote = new Array();

        for (var j = i; j < i + n + 1; j++) {

            // push midi vals 
            nNote.push(midiNoteSequence[j].midi);

            // push note to color vals 
            var letterNote = midiNoteSequence[j].name.slice(0, -1)
            var color = PITCH_TO_COLOR[letterNote]
            COLORS.push(color)
        }
        nNotesGroups[i] = nNote;
    }

    // Iterate through nNotesGroups and populate prevNoteSeqs and currNoteSeqs

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

function calculateNextNotes(midi, lenOfSequence) {

    var newSequence = new Array(); // Sequence of new notes to be played;
    var midiNoteSequence = midi.tracks[trackNo].notes; // array of notes and their properties (ex. duration)

    // Split return value of generateTransitions into three diff variables
    var transitionMatrix_calc = generateTransitions(midiNoteSequence);
    var prevNotegroups = transitionMatrix_calc[0];
    var currNotegroups = transitionMatrix_calc[1];
    var transitionMatrix = transitionMatrix_calc[2];

    var currentTime = 0;
    var speedplayFactor = 0.4;
    var dur;

    // Take the first n notes from the midi file to newSequence
    for (var i = 0; i < n; i++) {
        if (midiNoteSequence[i].duration < 0.5) {
            dur = midiNoteSequence[i].duration + speedplayFactor;
        } else {
            dur = midiNoteSequence[i].duration;
        }
        newSequence.push({ midi: parseInt(midiNoteSequence[i].midi), startTime: currentTime, endTime: currentTime + dur });
        currentTime += dur;
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

            if (randomProb < 0) {
                if (parseFloat(midiNoteSequence[i].duration) < 0.5) {
                    dur = parseFloat(midiNoteSequence[i].duration) + speedplayFactor;
                } else {
                    dur = parseFloat(midiNoteSequence[i].duration);
                }
                newSequence.push({ midi: parseInt(currNotegroups[j]), startTime: currentTime, endTime: currentTime + dur }); // MODIFY HERE TO CHANGE FORMAT OF 
                currentTime += dur;
                break;
            }
        }

    }


    return newSequence;

}

function playMarkov(midi, trackNo) {

    var noteSequence = calculateNextNotes(midi, numOfNotes);

    noteSequence.forEach(note => {
        playNote(note);
    });

}


function playNote(note) {

    var activeOscillators = [];

    const offset = 2; //it takes a bit of time to queue all these events

    var additiveOscillatorCount;
    if (additiveSynth) {
        additiveOscillatorCount = 5; // Number of oscillators in Additive Synthesis
    } else {
        additiveOscillatorCount = 1;
    }

    var gainNode = audioCtx.createGain();
    gainNode.gain.value = 0;

    for (var i = 0; i < additiveOscillatorCount; i++) {
        var additiveOsc = audioCtx.createOscillator();
        additiveOsc.type = "sine"
        if (additiveSynth) {
            additiveOsc.frequency.value = Tone.Frequency(note.midi, "midi") + 15 * Math.random();
        } else {
            additiveOsc.frequency.value = Tone.Frequency(note.midi, "midi");
        }
        additiveOsc.connect(gainNode);
        activeOscillators.push(additiveOsc);
    }

    for (var i = 0; i < additiveOscillatorCount; i++) {
        activeOscillators[i].start();
    }

    // Envelope
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setTargetAtTime(0.5, note.startTime + offset, 0.05);
    gainNode.gain.setTargetAtTime(0.4, note.startTime + offset + 0.2, 0.05);
    gainNode.gain.setTargetAtTime(0, note.endTime + offset - 0.2, 0.1);

    if (gainNode.gain == 0) {
        for (var i = 0; i < additiveOscillatorCount; i++) {
            activeOscillators[i].stop();
        }
    }

}

playButton.addEventListener('click', function() {

    if (!currentMidi) {
        window.alert("MIDI File Not Uploaded!");
        return;
    }

    selectedTrack = document.querySelector('input[name=track]:checked');
    trackNo = trackNameNumber[selectedTrack.id];
    n = parseInt(document.getElementById("nOrder").value);
    numOfNotes = parseInt(document.getElementById("numOfNotes").value);
    additiveSynth = document.getElementById("additive-synth").checked;

    if (!audioCtx) {

        audioCtx = new(window.AudioContext || window.webkitAudioContext);
        playButton.innerHTML = "Pause";

        playMarkov(currentMidi, trackNo);

        if (!colorscreen) {
            colorscreen = new App();
        }
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
        selectedTrack = null;
        trackNo = null;
        audioCtx = null;
        colorscreen = null;

        playButton.innerHTML = "Play";
        return;
    }

}, false);

uploadBtn.addEventListener("click", function() {
    file.click();
});

file.addEventListener("change", (e) => {

    //get the files
    const files = e.target.files;
    if (files.length > 0) {
        const file = files[0];
        parseFile(file);
    }

});

// color display 
class App {
    constructor() {
        this.canvas = document.getElementById('colorscreen');
        // document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d')

        this.pixelRatio = (window.devicePixelRatio > 1) ? 2 : 1;

        this.totalParticles = numOfNotes; // will be the number of notes 
        this.particles = []
        this.maxRadius = 900
        this.minRadius = 400

        window.addEventListener('resize', this.resize.bind(this), false)
        this.resize();

        window.requestAnimationFrame(this.animate.bind(this))
    }

    resize() {
        this.stageWidth = document.body.clientWidth;
        this.stageHeight = document.body.clientHeight;

        this.canvas.width = this.stageWidth;
        this.canvas.height = this.stageHeight;
        this.ctx.scale(this.pixelRatio, this.pixelRatio)

        this.createParticles()
    }

    createParticles() {
        let curColor = 0;
        this.particles = [];

        for (let i = 0; i < this.totalParticles; i++) {
            const item = new GlowParticle(
                Math.random() * this.stageWidth,
                Math.random() * this.stageHeight,
                Math.random() * (this.maxRadius - this.minRadius) + this.minRadius,
                COLORS[curColor]
            );

            if (++curColor >= COLORS.length) {
                curColor = 0;
            }

            this.particles[i] = item;
        }
    }

    animate() {
        window.requestAnimationFrame(this.animate.bind(this))

        this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight);

        for (let i = 0; i < this.totalParticles; i++) {
            const item = this.particles[i]
            item.animate(this.ctx, this.stageWidth, this.stageHeight)
        }
    }
}