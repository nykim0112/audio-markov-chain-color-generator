# song/album mood generator, markov to create new melody

https://github.com/Tonejs/Midi


Have 4 songs and 4 albums pre uploaded. Also add instructions for how a user can add more. 

1. read in MIDI file and convert to note sequence 
2. user sets markov n (either 1, 2, 3)
3. markov nth order (everything will be done on notes)
- create transition matrix
- calculate probability disribution 
- define first note as the first note of song 
- follow transitions 