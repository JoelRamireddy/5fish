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
	var args; //set this to the list specified by what
	createZip(args);
})

module.exports = {
   path: '/api',
   handler: app
}