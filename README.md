# New Melody and Color Generator 

## Installation 
install npm if necessary <br />
Then in command line type ```npm install @tonejs/midi```


## To run locally 
Run HTML file <br />
If "dev tools failed to load SourceMap error" -> In DevTools (F12) -> Settings (F1), Disable both "enable JS source maps" and "enable CSS source maps" in "Preferences -> Sources"

## Notes
Have 4 songs and 4 albums pre uploaded. Also add instructions for how a user can add more. 

1. read in MIDI file and convert to note sequence 
2. user sets markov n (either 1, 2)
3. markov nth order (everything will be done on notes)
- create transition matrix (prior notes.pitch and notes.duration)
- calculate probability disribution 
- define first note as the first note of song 
- follow transitions 
