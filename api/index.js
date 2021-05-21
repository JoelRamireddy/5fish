const sqlite3 = require('sqlite3').verbose();
const express = require('express')
const app = express()


app.get('/region/', (req, res) => {
	let db = new sqlite3.Database('./5fish.db');

    let sql = `select  grn_location_id, default_location_name
           from Location
           where Location.parent_location_id is null
					 order by default_location_name asc`;

	db.all(sql, [], (err, rows) => {
		if (err) {
			throw err;
		}
		res.json(rows)
		//rows.forEach((row) => {
		//	console.log(row.default_location_name);
		//});
	});

	// close the database connection
	db.close();
})

app.get('/country/:what', (req, res) => {

	let db = new sqlite3.Database('./5fish.db');
    let sql = `select grn_location_id, default_location_name
	from Location
	where Location.parent_location_id in
		(select Location.grn_location_id
		from Location
		where Location.parent_location_id = ?)
	order by default_location_name asc`;

	db.all(sql, [req.params.what], (err, rows) => {
		if (err) {
			throw err;
		}
		res.json(rows)
		//rows.forEach((row) => {
		//	console.log(row.default_location_name);
		//});
	});

	// close the database connection
	db.close();

})

app.get('/languages/:what', (req, res) => {

	let db = new sqlite3.Database('./5fish.db');
    let sql = `select Languages.grn_language_id as langID, Languages.default_language_name as langName
	from Languages inner join LocationLanguages on
		(Languages.grn_language_id = LocationLanguages.language_id)
		 inner join Location on (LocationLanguages.location_id = Location.grn_location_id)
	where Location.grn_location_id = ?
	order by langName asc`;

	db.all(sql, [req.params.what], (err, rows) => {
		if (err) {
			throw err;
		}
		res.json(rows)
		//rows.forEach((row) => {
		//	console.log(row.default_location_name);
		//});
	});

	// close the database connection
	db.close();

})

app.get('/programs/:what', (req, res) => {

	let db = new sqlite3.Database('./5fish.db');
    let sql = `select Programs.grn_program_id as progID, Programs.default_program_title as progName, Languages.default_language_name as langName
	from Languages inner join LanguagesPrograms on
		(Languages.grn_language_id = LanguagesPrograms.language_id)
		 inner join Programs on (Programs.grn_program_id = LanguagesPrograms.program_id)
	where Languages.grn_language_id = ?`;
	db.all(sql, [req.params.what], (err, rows) => {
		if (err) {
			throw err;
		}
		res.json(rows)
		//rows.forEach((row) => {
		//	console.log(row.default_location_name);
		//});
	});

	// close the database connection
	db.close();

})

app.get('/download/:what',(req,res) => {
	var nums = (req.params.what).split('.');
	nums.unshift("GRN.fishies.zip");
	// Version number declared in JSON
const VERSION_NUMBER = "7";
const MAX_ATTEMPTS = 3;  //maximum number of times to attempt downloading a file before giving up
const MAX_DOWNLOADS = 2; //maximum number of simultaneous downloads per program
const DOWNLOAD_DIR = "nodeScripts/downloads"
const FAIL_DELAY = 5000; //wait this many ms between download attempts

// Include AdmZip class
var AdmZip = require("adm-zip");
const download = require("download");

// Final zip file data
var zipInfo = new Array();

// Create an event handler
var EventEmitter = require("events");
var emitter = new EventEmitter();

//let know if had to abandom file
let wasError = false;


emitter.on("get_json_file", function getJsonFile(programId, outputFile, numAttempts) {
	// Get JSON data
	var jsonUrl = "https://api.s.globalrecordings.net/feeds/set/"+programId+"?app=6";
	var jsonFilename = custDir+"/"+programId+"."+VERSION_NUMBER+".json";

	const https = require("https");
	var file = fs.createWriteStream(jsonFilename);
	try{
		console.log("Getting " + jsonFilename);
		https.get(jsonUrl, function(res) {
			res.pipe(file);
			file.on("finish", function() {
				console.log("Got " + jsonFilename);
				file.close();
				const fileData = fs.readFileSync(jsonFilename, "utf8");
				const jsonData = JSON.parse(fileData);

				var zipFilename = jsonData.setFileBase+jsonData.setFileSuffix+" - mp3-low.zip";
				var audioDirName = jsonData.setFileBase+jsonData.setFileSuffix;

				if(jsonData.tracks.length > 1){
					emitter.emit("get_zip_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, 0);
				}else {
					emitter.emit("get_mp3_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, 0);
				}
			});
		});
	}
	catch(error){
		//log the error
		console.log("\nEncountered error with " + jsonFilename +  " download: \n");
		//console.log(error + "\n");

		//error was likely just too many requests, but coould be any kind of network error
		if(numAttempts < MAX_ATTEMPTS){
			console.log("Getting " + jsonFilename + " again");
			numAttempts++;
			//wait one second
			setTimeout(emitter.emit("get_json_file", val, outputFile, numAttempts), FAIL_DELAY);
		}else {
			console.log("Failed to download " + jsonFilename + " " + numAttempts + " times. Giving up");
			wasError = true;
			numProgsDone++;
		}
	}
});

emitter.on("get_zip_file", function getZipFile(zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, numAttempts) {
	const https = require("https");
	const download = require('download');

	var zipUrl = "https://api.globalrecordings.net/files/set/mp3-low/"+programId+".zip";

	console.log("Getting " + zipFilename);
	//catch any HTTP request errors
	download(zipUrl, custDir)
	.then(() => {
    //update zipFilename to match the one actually downloaded
		const files = fs.readdirSync(custDir);
		for (const file of files) {
  			if(file.indexOf(programId) != -1 && file.indexOf(".json") == -1){
				zipFilename = file;
				audioDirName = zipFilename.substring(0, zipFilename.indexOf(" - mp3"));
			  }
		}
		console.log("Got " + zipFilename);

		// Edit existing zip file
		var zip;
		try{
			//it is now in a folder which shares it's name
			console.log(custDir+"/"+zipFilename);
			zip = new AdmZip(custDir+"/"+zipFilename);
		}catch(error){
			//log the error
			console.log("\nError with " + zipFilename + "; oppening file led to an error:");
			console.error(error);

			//delete the old file
			//fs.unlinkSync(zipFilename);
			return;
		}

		//get the language. This can vary if there is puntuation. Remove any
		let language = jsonData.languages[0].value;
		//punctuation is always followed by a space
		//get the location of a space
		var spaceInd = language.indexOf(" ");
		if(spaceInd != -1){
			//make sure what precedes space is punctuation before cutting it out
			if((""+language.charAt(spaceInd-1)).match(/^([:;,.])/)){
				//cut out the unwanted value
				var tempBack = language.substring(0, spaceInd - 1);
				var tempFront = language.substring(spaceInd, language.length);
				language = tempBack + tempFront;
			}
		}

		//this inner_dir is in english, while the audio files are in the directory written in their language
		//const inner_dir = language+" "+jsonData.title+" "+programId;
		//this inner_dir makes it match
		const inner_dir = audioDirName;


		//console.log(inner_dir);

		zip.addLocalFile(jsonFilename, language+"/"+inner_dir);

		//resolve corruption issues with unicode characters
		zip.getEntries().forEach(entry => {
			entry.header.made = 0x314;     //this may be OS specific
			entry.header.flags |= 0x800;   // Set bit 11 - APP Note 4.4.4 Language encoding flag (EFS)
		});

		zip.writeZip(custDir+"/"+zipFilename);

		//store the zip file downloaded and the language of the program
		zipInfo.push({file: custDir+"/"+zipFilename, lang: language, dir: inner_dir});

		//keep track of how many programs have been processed and only finish after last
		numProgsDone++;
		if(numProgsDone == numProgs){
			emitter.emit("finish", outputFile);
		} else if(progInd < numProgs) {
			//if not done, try to send the next as long as any request are left to make
			emitter.emit("get_json_file", programIds[progInd], outputFile, 0);
			progInd++;
		}
	})
	.catch(error => {
		//wait a second and then try again, up to MAX_ATTEMPTS times
		console.log("\nRecived the following error while downloading zip: \n");
		console.log(error + "\n");

		if(numAttempts < MAX_ATTEMPTS){
			console.log("Getting " + zipFilename + " again in " + FAIL_DELAY + "ms");
			numAttempts++;
			//wait for delay
			setTimeout(() => {emitter.emit("get_zip_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, numAttempts)}, FAIL_DELAY);
		}else {
			console.log("Failed to download " + zipFilename + " " + numAttempts + " times. Giving up");
			wasError = true;
			numProgsDone++;
		}
	});
});


//alternate handling for lone MP3 files
emitter.on("get_mp3_file", function getZipFile(zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, numAttempts) {
	const download = require('download');

	var mp3Url = "https://api.globalrecordings.net/files/set/mp3-low/"+programId+".mp3";
	//change from zip to mp3
	var mp3FileName = zipFilename.substring(0, zipFilename.length - 3);
	mp3FileName =  `${__dirname}` + "/" + mp3FileName + "mp3";

  //get the language. This can vary if there is puntuation. Remove any
  	let language = jsonData.languages[0].value;
  	// punctuation is always followed by a space
  	// get the location of a space
  	var spaceInd = language.indexOf(" ");
  	if(spaceInd != -1){
  		//make sure what precedes space is punctuation before cutting it out
  		if((""+language.charAt(spaceInd-1)).match(/^([:;,.])/)){
  			//cut out the unwanted value
  			var tempBack = language.substring(0, spaceInd - 1);
  			var tempFront = language.substring(spaceInd, language.length);
  			language = tempBack + tempFront;
  		}
  	}
			//this inner_dir is in english, while the audio files are in the directory written in their language
			//const inner_dir = language+" "+jsonData.title+" "+programId;
			//this inner_dir makes it match
	const inner_dir = audioDirName;

	console.log("Getting " + mp3FileName);

	download(mp3Url, custDir)
	.then(() => {
		console.log("Got " + mp3FileName);

		//the file will be ####.mp3 inside of a folder with name mp3FileName

		// Edit existing zip file
		var zip;
		try{
			zip = new AdmZip();
			zip.addLocalFile(custDir+"/"+programId + ".mp3", language+"/"+inner_dir);
		}catch(error){
			//log the error
			console.log("\nError with " + mp3FileName + "; oppening file led to the error:");
			console.log(error + "\n");

			//delete the old file
			//fs.unlinkSync(programId + ".mp3");
			//try again
			//emitter.emit("get_zip_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile);
			return;
		}


		console.log(inner_dir);

		zip.addLocalFile(jsonFilename, language+"/"+inner_dir);

		//resolve corruption issues with unicode characters
		zip.getEntries().forEach(entry => {
			entry.header.made = 0x314;     //this may be OS specific
			entry.header.flags |= 0x800;   // Set bit 11 - APP Note 4.4.4 Language encoding flag (EFS)
		});


		zip.writeZip(custDir+"/"+zipFilename);

		//store the zip file downloaded and the language of the program
		zipInfo.push({file: custDir+"/"+zipFilename, lang: language, dir: inner_dir});

		//keep track of how many programs have been processed and only finish after last
		numProgsDone++;
		if(numProgsDone == numProgs){
			emitter.emit("finish", outputFile);
		}else if(progInd < numProgs) {
			//if not done, try to send the next as long as any request are left to make
			emitter.emit("get_json_file", programIds[progInd], outputFile, 0);
			progInd++;
		}
	})
	.catch(error => {
		console.log("/nRecived error with MP3 download: ");
		console.log(error + "/n");

		//try again after delay if okay
		if(numAttempts < MAX_ATTEMPTS){
			console.log("Getting " + mp3FileName + " again in " + FAIL_DELAY + "ms");
			numAttempts++;
			//wait for the delay
			setTimeout(() => {emitter.emit("get_mp3_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, numAttempts)}, FAIL_DELAY);
		}else {
			console.log("Failed to download " + mp3FileName + " " + numAttempts + " times. Giving up");
			wasError = true;
			numProgsDone++;
		}
	});
});


emitter.on("finish", function zipFile(outputFile) {
	// Retrieve cmd line args
	// Finalize
	var zip = new AdmZip();
	zipInfo.forEach((val, index) => {
		//console.log("Val: " + val.file + ", " +  val.lang + ", " + val.dir);

		//unzip the entire directory; it only contains one program
//node: if we do it by file, just use the getEntries and pull out files by name to get entryName to extract file by file
		var tempZip = new AdmZip(val.file);
		var newFolderName = custDir+"/temp"; //want to erase previous work every time
		tempZip.extractAllTo(newFolderName, true);
		//var entry = tempZip.getEntry(val.lang);
		console.log(newFolderName+"/"+val.lang+"/"+val.dir,"/"+val.lang);

		//rezip the file into the new zip
		zip.addLocalFolder(newFolderName+"/"+val.lang+"/"+val.dir,"/"+val.lang+"/"+val.dir);
	});



	//resolve corruption issues with unicode characters
	zip.getEntries().forEach(entry => {
		entry.header.made = 0x314;     //this may be OS specific, need to look into that
		entry.header.flags |= 0x800;   // Set bit 11 - APP Note 4.4.4 Language encoding flag (EFS)
	});

	zip.addLocalFile('api/5fish.json');
	zip.addLocalFile('api/readme.txt');
	zip.writeZip(custDir+"/"+outputFile);

	console.log("Done");
	res.download(custDir+"/"+outputFile, function(err){
		fs.rmdir(custDir, {recursive: true}, (err) => {
			if(err){
				console.log("Failed to delete " + custDir);
			}else{
				console.log("Deleted " + custDir);
			}
		});
	});

	//delete directory to cleanup after
});


function createZip(args){
	//set up drectories
	var d = new Date();
	var newDir = (Math.floor(d.getTime()*1000)).toString();
	custDir = DOWNLOAD_DIR + "/" + newDir;
	fs.mkdirSync(custDir);


	//let programIds = new Array();
	numProgs = args.length - 1;
	console.log(numProgs);

	if (args.length < 2) {
		console.log("ERROR: No input files!");
		console.log("Usage: node zipper.js <outputFile> <inputFile1> ...");
		return;
	}

	args.forEach((val, index) => {
		programIds.push(val);
	});

	//now request each item retrieved
	var AdmZip = require("adm-zip");
	var zipFile = new AdmZip();

	var outputFile = programIds[0];
	programIds = programIds.slice(1);

	//do the first MAX_DOWNLOADS
	for(progInd = 0 ; progInd < MAX_DOWNLOADS && progInd < programIds.length; progInd++){
		emitter.emit("get_json_file", programIds[progInd], outputFile, 0);
	}

  return newDir;
}

const fs = require("fs");

//global vars
let numProgs; //global to store number of args so know when to finish
let numProgsDone = 0;
let progInd = 0; //use this to keep track of which program to download next
let programIds = new Array();

//make a unqiue directory for this specific request set

let custDir;
var newDir = createZip(nums);

})


module.exports = {
   path: '/api',
   handler: app
}
