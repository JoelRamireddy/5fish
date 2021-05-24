# 5fishInterface

## Build Setup (Genral Nuxt.js)

```bash
# install dependencies
$ npm install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
```
## Dependencies

sqlite3
console
express
adm-zip
download
events
https
fs

# Frontend structure:

Layer structure of the website:
default -> AppHeader -> [home, programs, about]
programs -> selectorBar -> cart

cart acts as the child of selectorBar and there is an exchange of data between those components.

home and about are experimental pages that are used to show that this webpage can be integrated with the nuxt framework that GRN is beginning to implement.

index.js in the api folder contains all the code for our apis.(Express.js).

API:
'/region/', '/country/:what' and '/languages/:what' are used for the drop downs.
'/programs/:what' is used to populate all the available programs.
'/download/:what' is the api that handles the download and the zipping on the server side. It also sends the file to the client for download.

# Backend Program Flow:

The backend zip creator is broken into a callable function and several asychronus events, all found inside of the API index file. The program flow works as follows:

createZip(Args) takes an array with the first element being the name of the zip file to be created and the remaining elements being the program ID's to be included, and then triggers. It then starts a number of synchronus downloads equal to the max provided by the API, which is currently 2. 

The get_json_file program downloads the json file from GRN's API that coresponds to the ID. The program then uses a prefix attached to the ID to find which kind of file to download. Currenty only GRN audio files are supported, but the foundation to allow other types of file downloads is there. 

From here the get_zip_file or get_mp3_file event is trigered depending on if the file downloads as a zip of multiple files or a single mp3. The files are formated to be a zip with the .json file in the program directory. On finishing, each ansynchronus event will trigger the next one in line. 

Once the last file completes downloading, the finish event is triggered. This unzips all of the files and formatts them correctly in a temp directory, and then rezips the file.

Each request is placed in a directory named after the date in ms that the request was made on. This is deleted after the zip is passed to the user, clearing all of the downloads. 


# Possible Improvements:

## General:

The server needs to be hardened. Currently, several potential bugs could cause server crahses if they occur. More code blocks need to be placed in try/catch blocks, and more assumptions need to be checked, particularly from user input. 

Move the backend from the API index.js into its own file to improve readability. This is challenging because events fail trigger properly when this is done, but it may be possible to exports events, or else export all the functions the events will trigger. 

Add functionality for GRN video, Jesus Film, language samples, and images to the front and backend, as well as a way to specify the quality of the selected items.

Add the ability to select individual tracks from a program.

Change the way the json file is installed to match the way the rest of the files are installed. The sytax and error handling look neater with the download library rather than using fs.

Note that the about page was largly added as a nod to everyone who helped on the project; there is no pressure to keep the credits in a prominent location like that. 

## Bugs:

File names with pipes (|) are used as the delimiter for the list of programs which starts with the user defined file name. If a pipe is included in the file name, the server will consfure the file name for a name and a prgram ID, resulting in a server crash. The delimiter must be something which would not show up in any download file names, and the program needs to perform form validation.  

Multiple requests from users at the same time (and also spamming the download button) overwhelm the API and cause files to have to be left out of the final zip. An error flag is set, but the user is not notified.

The download of lone mp3 files gives the files names in the format <GRNProgramID>.mp3. I am not sure why this occurs, but it should be fixed for consistencie's sake 




