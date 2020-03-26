var express = require('express');
var { Interval, Collection, Note, Mode, Scale } = require("@tonaljs/tonal");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('input')
});

router.post('/output', function(req, res, next) {
  const targetNote = req.body.targetnote
  const rootNote = req.body.rootNote

  function quartalChord (specialNote, degree) { //3 note quartal "tonic" chord
    switch (degree) {
      case 1:
        return [specialNote, Note.transpose(specialNote, "4P"), Note.transpose(specialNote, "7m")]
      break;
      case 2:
        return [Note.transpose(specialNote, "-4P"), specialNote, Note.transpose(specialNote, "7m")]
      break;
      case 3:
        return [Note.transpose(specialNote, "-7m"), Note.transpose(specialNote, "-4P"), specialNote]
      break;
    }
  }

  const quartaltonic1 = quartalChord(rootNote, 1)
  const quartaltonic2 = quartalChord(rootNote, 2)
  const quartaltonic3 = quartalChord(rootNote, 3)

  const quartalcadential1 = quartalChord(targetNote, 1)
  const quartalcadential2 = quartalChord(targetNote, 2)
  const quartalcadential3 = quartalChord(targetNote, 3)

  const quartaltonics = [quartaltonic1, quartaltonic2, quartaltonic3]
  const quartalcadentials = [quartalcadential1, quartalcadential2, quartalcadential3]


//concatenate
//find scales
//identify modes
//have output = mode: combination
  var possibleKeysAndModes = {};
  var chordNotes = {}

  const allKeys = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
  allKeys.forEach((key, i) => { //2. in each key
    chordNotes[key] = {}
    Mode.all().forEach((mode, i) => { // 1. for each mode
      chordNotes[key][mode.name] = [];
      const currentRootNote = key //or key of mode same thing
      const currentMode = mode; //i like organization and specificity
      const modeNotes = mode.intervals.map(Note.transposeFrom(currentRootNote));
      modeNotes.forEach((modeNote, i) => { // 3. create a array of diatonic fourth chords for stated key
        function consecutiveFourthNote (previousNote, allNotes) { //simplify previous and allnotes
          var fourthPreviousNote = Note.simplify(Note.transpose(previousNote, "4P"))
          var simplifiedPreviousNote = Note.simplify(previousNote)
          var simplifiedAllNotes = allNotes.map(Note.simplify)

          if(simplifiedAllNotes.indexOf(simplifiedPreviousNote) == 4) {
            if(fourthPreviousNote == simplifiedAllNotes[0]) {
              return fourthPreviousNote;
            }
          }
          if (simplifiedAllNotes.indexOf(simplifiedPreviousNote) == 5) {
            if(fourthPreviousNote == simplifiedAllNotes[1]) {
              return fourthPreviousNote;
            }
          }
          if (simplifiedAllNotes.indexOf(simplifiedPreviousNote) == 6) {
            if(fourthPreviousNote == simplifiedAllNotes[2]) {
              return fourthPreviousNote;
            }
          }
          if (fourthPreviousNote == simplifiedAllNotes[simplifiedAllNotes.indexOf(simplifiedPreviousNote) + 3]) {
             return fourthPreviousNote;
          }
          if (Interval.distance(fourthPreviousNote, simplifiedAllNotes[simplifiedAllNotes.indexOf(simplifiedPreviousNote) + 3]) !== "4P") {
            return "TRITONE";
          }
          if (previousNote == "TRITONE") {
            return "bad chord";
          }
        }
        var firstNote = Note.simplify(modeNote);
        var secondNote = consecutiveFourthNote(firstNote, modeNotes)
        var thirdNote = consecutiveFourthNote(secondNote, modeNotes)
        chordNotes[key][mode.name].push([firstNote, secondNote, thirdNote])
      });
    });
  })

  for (var keySet in chordNotes) {
    possibleKeysAndModes[keySet] = {}
    for(var modeSet in chordNotes[keySet]) {
      possibleKeysAndModes[keySet][modeSet] = {}
      var characterNote = "";
      switch (modeSet) {
        case "ionian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[3]
        break;
        case "dorian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[5]
        break;
        case "phrygian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[1]
        break;
        case "lydian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[3]
        break;
        case "mixolydian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[6]
        break;
        case "aeolian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[5]
        break;
        case "locrian":
          characterNote = Mode.get(modeSet).intervals.map(Note.transposeFrom(keySet))[4]
        break;
      }
      chordNotes[keySet][modeSet].forEach((possibleChord, i) => {
            var similarCadentialNoteCount = 0; //max is 3 since the chords are build out of 3 4ths
            var similarTonicNoteCount = 0; //max is 3 since the chords are build out of 3 4ths

            //for comparing tonics that dont have character note
            if (!possibleChord.includes(characterNote)) {
              quartaltonics.forEach((tonicChord, i) => {
                if(Interval.distance(possibleChord[0], tonicChord[0]) == "1P") {
                  similarTonicNoteCount++
                }
                if(Interval.distance(possibleChord[1], tonicChord[1]) == "1P") {
                  similarTonicNoteCount++
                }
                if(Interval.distance(possibleChord[2], tonicChord[2]) == "1P") {
                  similarTonicNoteCount++
                }
                if (similarTonicNoteCount == 3) { //if chord is same add to output
                  if(tonicChord == quartaltonic1) {
                    possibleKeysAndModes[keySet][modeSet]["tonic1"] = tonicChord
                  }
                  if(tonicChord == quartaltonic2) {
                    possibleKeysAndModes[keySet][modeSet]["tonic2"] = tonicChord
                  }
                  if(tonicChord == quartaltonic3) {
                    possibleKeysAndModes[keySet][modeSet]["tonic3"] = tonicChord
                  }
                }
              });
            }
              //for comparing cadentials regardless if contains root note
            quartalcadentials.forEach((cadentialChord, i) => {
              if(Interval.distance(possibleChord[0], cadentialChord[0]) == "1P") {
                similarCadentialNoteCount++
              }
              if(Interval.distance(possibleChord[1], cadentialChord[1]) == "1P") {
                similarCadentialNoteCount++
              }
              if(Interval.distance(possibleChord[2], cadentialChord[2]) == "1P") {
                similarCadentialNoteCount++
              }
              if (similarCadentialNoteCount == 3) {
                if(cadentialChord == quartalcadential1) {
                  possibleKeysAndModes[keySet][modeSet]["cadential1"] = cadentialChord
                }
                if(cadentialChord == quartalcadential2) {
                  possibleKeysAndModes[keySet][modeSet]["cadential2"] = cadentialChord
                }
                if(cadentialChord == quartalcadential3) {
                  possibleKeysAndModes[keySet][modeSet]["cadential3"] = cadentialChord
                }
              }
          });
      });
    }
  }

  res.render('output', { "data": possibleKeysAndModes })
});

module.exports = router;
