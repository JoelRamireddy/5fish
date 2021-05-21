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

# Zipper Program Flow:

The backend zip creator is broken into a callable function and several asychronus events. The program flow works as follows:

createZip(Args) takes an array with the first element being the name of the zip file to be created and the remaining elements being the program ID's to be included, and then triggers 

The get_json_file 


# Possible Improvemnets:

Currently the name of the zip file created is hard coded. The code and frontend could be changed to enable the user to pick the file name, though the GRN.<name>.zip format will need to be maintained 

Multiple request from users at the same time (and also spamming the download button) overwhelm the API and cause files to have to be left out of the final zip (need to warn users)