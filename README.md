# 5fishInterface

## Build Setup

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
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

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

createZip(Args) takes an array with the first element being the name of the zip file to be created and the remaining elements being the program ID's to be included, and then triggers 

The get_json_file program downloads the json file from GRN's API that coresponds to the ID. The program then uses a prefix attached to the ID to find which kind of audio 


# Possible Improvemnets:

Currently the name of the zip file created is hard coded. The code and frontend could be changed to enable the user to pick the file name, though the GRN.<name>.zip format will need to be maintained 

Multiple request from users at the same time (and also spamming the download button) overwhelm the API and cause files to have to be left out of the final zip (need to warn users)

Move the backend from the  API index.js into its own file to improve readability. This is challenging because events fail trigger properly when this is done, but it may be possible to exports events, or else export all the functions the events will trigger. 