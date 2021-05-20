// Version number declared in JSON
const VERSION_NUMBER = "7";
const MAX_ATTEMPTS = 3; //maximum number of times to attempt downloading a file before giving up
const DOWNLOAD_DIR = "./downloads"
const FAIL_DELAY = 10000; //wait this many ms between download attempts

// Include AdmZip class
var AdmZip = require("adm-zip");

// Final zip file data
var zipInfo = new Array();

// Create an event handler
var EventEmitter = require("events");
var emitter = new EventEmitter();

emitter.on("get_json_file", function getJsonFile(programId, outputFile, numAttempts) {
	// Get JSON data
	var jsonUrl = "https://api.s.globalrecordings.net/feeds/set/"+programId+"?app=6";
	var jsonFilename = DOWNLOAD_DIR+"/"+programId+"."+VERSION_NUMBER+".json";
	
	const https = require("https");
	const fs = require("fs");
	var file = fs.createWriteStream(jsonFilename);
	try{
		https.get(jsonUrl, function(res) {
			res.pipe(file);
			file.on("finish", function() {
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
			setTimeout(emitter.emit("get_json_file", val, outputFile, numAttempts), 1000);
		}else {
			console.log("Failed to download " + jsonFilename + " " + numAttempts + " times. Giving up");
		}	
	}
});

emitter.on("get_zip_file", function getZipFile(zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, numAttempts) {
	const https = require("https");
	const fs = require("fs");
	const download = require('download');
	
	var zipUrl = "https://api.globalrecordings.net/files/set/mp3-low/"+programId+".zip";

	console.log("getting " + zipFilename);
	//catch any HTTP request errors
	download(zipUrl, DOWNLOAD_DIR)
	.then(() => {
		console.log("got " + zipFilename);
		// Edit existing zip file
		var zip;
		try{
			//it is now in a folder which shares it's name
			zip = new AdmZip(DOWNLOAD_DIR+"/"+zipFilename);
		}catch(error){
			//log the error
			console.log("\nError with " + zipFilename + "; oppening file led to an error:");
			console.log(error + "\n");

			//delete the old file
			//fs.unlinkSync(zipFilename);
			return;
		}

		const language = jsonData.languages[0].value;
		//this inner_dir is in english, while the audio files are in the directory written in their language
		//const inner_dir = language+" "+jsonData.title+" "+programId;
		//this inner_dir makes it match
		const inner_dir = audioDirName;
		console.log(inner_dir);

		zip.addLocalFile(jsonFilename, language+"/"+inner_dir);

		//resolve corruption issues with unicode characters 
		zip.getEntries().forEach(entry => {
			entry.header.made = 0x314;     //this may be OS specific
			entry.header.flags |= 0x800;   // Set bit 11 - APP Note 4.4.4 Language encoding flag (EFS)
		});

		zip.writeZip(DOWNLOAD_DIR+"/"+zipFilename);

		//store the zip file downloaded and the language of the program
		zipInfo.push({file: DOWNLOAD_DIR+"/"+zipFilename, lang: language, dir: inner_dir}); 

		//keep track of how many programs have been processed and only finish after last
		numProgsDone++;
		if(numProgsDone == numProgs){
			emitter.emit("finish", outputFile);
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
		}	
	});
});


//alternate handling for lone MP3 files
emitter.on("get_mp3_file", function getZipFile(zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile, numAttempts) {
	const fs = require("fs");
	const download = require('download');

	var mp3Url = "https://api.globalrecordings.net/files/set/mp3-low/"+programId+".mp3";
	//change from zip to mp3
	var mp3FileName = zipFilename.substring(0, zipFilename.length - 3);
	mp3FileName =  `${__dirname}` + "/" + mp3FileName + "mp3";
	console.log("getting " + mp3FileName + " from " + mp3Url);
	


	//need this sooner now...
	const language = jsonData.languages[0].value;
			//this inner_dir is in english, while the audio files are in the directory written in their language
			//const inner_dir = language+" "+jsonData.title+" "+programId;
			//this inner_dir makes it match
	const inner_dir = audioDirName;
	download(mp3Url, DOWNLOAD_DIR)
	.then(() => {
		console.log("got " + mp3FileName);

		//the file will be ####.mp3 inside of a folder with name mp3FileName

		// Edit existing zip file
		var zip;
		try{
			zip = new AdmZip();
			zip.addLocalFile(DOWNLOAD_DIR+"/"+programId + ".mp3", language+"/"+inner_dir);
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


		zip.writeZip(DOWNLOAD_DIR+"/"+zipFilename);

		//store the zip file downloaded and the language of the program
		zipInfo.push({file: DOWNLOAD_DIR+"/"+zipFilename, lang: language, dir: inner_dir}); 

		//keep track of how many programs have been processed and only finish after last
		numProgsDone++;
		if(numProgsDone == numProgs){
			emitter.emit("finish", outputFile);
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
		var newFolderName = DOWNLOAD_DIR+"/temp"; //want to erase previous work every time
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

	zip.addLocalFile('5fish.json');
	zip.addLocalFile('readme.txt');
	zip.writeZip(DOWNLOAD_DIR+"/"+outputFile)

	console.log("Done");
});


//global vars
let numProgs; //global to store number of args so know when to finish
let numProgsDone = 0;

// Retrieve cmd line args
const args = process.argv.slice(2);
createZip(args);

function createZip(args){
	
	var programIds = new Array();
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
	const fs = require("fs");
	var AdmZip = require("adm-zip");
	var zipFile = new AdmZip();

	var outputFile = programIds[0];
	var programIds = programIds.slice(1);

	programIds.forEach((val, index) => {
		emitter.emit("get_json_file", val, outputFile, 0);	
	});	
}

