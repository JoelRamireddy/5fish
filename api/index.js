const sqlite3 = require('sqlite3').verbose();
const express = require('express')
const app = express()


app.get('/region/', (req, res) => {
    
	let db = new sqlite3.Database('./5fish.db');
	
    let sql = `select  grn_location_id, default_location_name 
           from Location 
           where Location.parent_location_id is null`;

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
		where Location.parent_location_id = ?)`;

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
	where Location.grn_location_id = ?`;

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
    let sql = `select Programs.grn_program_id as progID, Programs.default_program_title as progName
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
		// Version number declared in JSON
	const VERSION_NUMBER = "7";

	// Include AdmZip class
	var AdmZip = require("adm-zip");

	// Final zip file data
	var zipInfo = new Array();

	// Create an event handler
	var EventEmitter = require("events");
	var emitter = new EventEmitter();

	emitter.on("get_json_file", function getJsonFile(programId, outputFile) {
		// Get JSON data
		var jsonUrl = "https://api.s.globalrecordings.net/feeds/set/"+programId+"?app=6";
		var jsonFilename = programId+"."+VERSION_NUMBER+".json";
		
		const https = require("https");
		const fs = require("fs");
		var file = fs.createWriteStream(jsonFilename);
		https.get(jsonUrl, function(res) {
			res.pipe(file);
			file.on("finish", function() {
				file.close();
				const fileData = fs.readFileSync(jsonFilename, "utf8");
				const jsonData = JSON.parse(fileData);

				var zipFilename = jsonData.setFileBase+jsonData.setFileSuffix+" - mp3-low.zip";
				var audioDirName = jsonData.setFileBase+jsonData.setFileSuffix;

				if(jsonData.tracks.length > 1){
					emitter.emit("get_zip_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile);
				}else {
					emitter.emit("get_mp3_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile);
				}
			});
		});
	});

	emitter.on("get_zip_file", function getZipFile(zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile) {
		const https = require("https");
		const fs = require("fs");
		const download = require('download');
		
		var zipUrl = "https://api.globalrecordings.net/files/set/mp3-low/"+programId+".zip";

		console.log("getting " + zipFilename);

		download(zipUrl, "./")
		.then(() => {
				console.log("got " + zipFilename);
				// Edit existing zip file
				var zip;
				try{
					//it is now in a folder which shares it's name
					zip = new AdmZip(zipFilename);
				}catch(error){
					//log the error
					console.log("\nFailed to download file " + zipFilename + "; oppening file led to an error:");
					console.error(error);

					//delete the old file
					//fs.unlinkSync(zipFilename);

					//attempt to recover
					//console.log("See if actually was an mp3...\n");
					//emitter.emit("get_mp3_file", zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile);
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


				zip.writeZip(zipFilename);

				//store the zip file downloaded and the language of the program
				zipInfo.push({file: zipFilename, lang: language, dir: inner_dir}); 

				//keep track of how many programs have been processed and only finish after last
				numProgsDone++;
				if(numProgsDone == numProgs){
					emitter.emit("finish", outputFile);
				}
		});
	});


	//alternate handling for lone MP3 files
	emitter.on("get_mp3_file", function getZipFile(zipFilename, programId, jsonFilename, jsonData, audioDirName, outputFile) {
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


		download(mp3Url, "./")
		.then(() => {
				console.log("got " + mp3FileName);

				//the file will be ####.mp3 inside of a folder with name mp3FileName

				// Edit existing zip file
				var zip;
				try{
					zip = new AdmZip();
					zip.addLocalFile(programId + ".mp3", language+"/"+inner_dir);
				}catch(error){
					//log the error
					console.log("\nFailed to download file " + zipFilename + "; oppening file led to the error:");
					//console.error(error);
					
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


				zip.writeZip(zipFilename);

				//store the zip file downloaded and the language of the program
				zipInfo.push({file: zipFilename, lang: language, dir: inner_dir}); 

				//keep track of how many programs have been processed and only finish after last
				numProgsDone++;
				if(numProgsDone == numProgs){
					emitter.emit("finish", outputFile);
				}
		});
	});


	emitter.on("finish", function zipFile(outputFile) {
		// Retrieve cmd line args
		// Finalize
		var zip = new AdmZip();
		zipInfo.forEach((val, index) => {
			console.log("Val: " + val.file + ", " +  val.lang + ", " + val.dir);

			//unzip the entire directory; it only contains one program
	//node: if we do it by file, just use the getEntries and pull out files by name to get entryName to extract file by file
			var tempZip = new AdmZip(val.file);
			var newFolderName = "temp"; //want to erase previous work every time
			tempZip.extractAllTo(newFolderName, true); 
			//var entry = tempZip.getEntry(val.lang);
			console.log(newFolderName+"/"+val.lang+"/"+val.dir,"/"+val.lang);

			//rezip the file into the new zip
			zip.addLocalFolder("./"+newFolderName+"/"+val.lang+"/"+val.dir,"/"+val.lang+"/"+val.dir);
		});

		

		//resolve corruption issues with unicode characters 
		zip.getEntries().forEach(entry => {
			entry.header.made = 0x314;     //this may be OS specific, need to look into that
			entry.header.flags |= 0x800;   // Set bit 11 - APP Note 4.4.4 Language encoding flag (EFS)
		});

		zip.addLocalFile('5fish.json');
		zip.addLocalFile('readme.txt');
		zip.writeZip(outputFile)

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
			emitter.emit("get_json_file", val, outputFile);	
		});	
	}	
})

module.exports = {
   path: '/api',
   handler: app
}