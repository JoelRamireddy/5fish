<template>
<div>
  <div class="something">
    <ul id="lister">
      <li v-for="name of names" v-bind:key="name.name">
        {{name}}
      </li>
    </ul>
  </div>
  
  <button id = "download" v-on:click = "downloadCart" :disabled = "done == true">Download</button>
</div>
</template>

<script>
export default {
    props : {checkedBoxes : Array, PORT_NUMBER : String, fileName : String},
    data: function(){
        return{
            total : [], 
            progIDs : [],
            names : [],
            done : true
        }
    },
    methods : {
        updateCart : function(){
            this.done = false;
            this.names = [];
            this.progIDs = [];
            //split into two arrays 
            for (var i = 0; i < this.checkedBoxes.length; i++){
                //split based on the location of "=" 
                var temp = this.checkedBoxes[i];
                var ind = temp.indexOf("=");
                var tempID = temp.substring(0, ind);
                var tempName = temp.substring(ind+1, temp.length);
                this.progIDs.push(tempID);
                this.names.push(tempName);
            }
            console.log(this.progIDs)
        },
        resetCart : function(){
            this.names = [];
            this.progIDs = [];
            this.done = true;
        },
        downloadCart : function(){
            console.log(this.fileName)
            alert('Your Download has Begun. This may take a few minutes.')
            const axios = require('axios');
            const FileDownload = require('js-file-download');
            //file types
            const GRN_VIDEO = "GV:";
            const JESUS_FILM = "JF:";
            const LANG_SAMPLE = "LS";
            const IMAGE = "IM";
            const GRN_AUDIO = "GA";
            var addToString = "GRN." + this.fileName + ".zip-";
            for(var i = 0; i < this.progIDs.length-1; i++){
                //make all audio by default, make this dynamic later; frontend can't do 
                addToString += GRN_AUDIO + ":" + this.progIDs[i].toString() + "-";
            }
            addToString += GRN_AUDIO + ":" + this.progIDs[this.progIDs.length-1];
            // axios.get('http://localhost:3000/api/download/' + addToString).then(response => (this.places = response.data));
            this.done = true;
            axios({
            url: 'http://localhost:3000/api/download/' + addToString,
            method: 'GET',
            responseType: 'blob', // Important
                }).then((response) => {
                FileDownload(response.data, 'GRN.'+ this.fileName +'.zip');
            });
            this.done = false;
        }
    }
}
</script>

<style>
.something { 
  border:2px solid #526488; 
  width:500px; 
  height: 350px;
  overflow-y: scroll;
  position: relative;
  display: inline-block;
  left: 100%;
  transform: translate(-100%, -100%);}
  
  #download{
      position: relative;
      left:19%;
      transform: translate(-50%, -2200%)
  }
  .bar{
      position: relative;
      left: 19%;
  }
</style>