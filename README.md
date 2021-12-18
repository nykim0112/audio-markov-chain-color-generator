# New Melody and Color Generator 

## Installation 
install npm if necessary <br />
Then in command line type ```npm install @tonejs/midi```


## To run locally 
Run HTML file <br />
If "dev tools failed to load SourceMap error" -> In DevTools (F12) -> Settings (F1), Disable both "enable JS source maps" and "enable CSS source maps" in "Preferences -> Sources"

##  TODOs 
- get notes to play separately (prob an Amy task)
- multiple midi file option 


## Code Outline
1. Upload MIDI file and convert to JSON like note sequence. (TODO- add multiple file upload buttons and then markov just the melody i think)
2. User sets nth order = 1, 2, or 3
3. Markov algorithm calculates next notes 
4. New sequence plays 
