<template>
<div>
  <div class="something">
    <ul id="lister">
      <li v-for="name of names" v-bind:key="name.name">
        {{name}}
      </li>
    </ul>
  </div>
  <button id = "reset" v-on:click = "resetCart">Reset Cart</button>
  <button id = "download" v-on:click = "downloadCart">Download</button>
</div>
</template>

<script>
export default {
    props : {checkedBoxes : Array},
    data: function(){
        return{
            total : [], 
            progIDs : [],
            names : []
        }

    },
    methods : {
        updateCart : function(){
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
        },
        downloadCart : function(){
            const axios = require('axios');
            const FileDownload = require('js-file-download');

            var addToString = "";
            for(var i = 0; i < this.progIDs.length-1; i++){
                addToString += this.progIDs[i].toString() + ".";
            }
            addToString += this.progIDs[this.progIDs.length-1];
            // axios.get('http://localhost:3000/api/download/' + addToString).then(response => (this.places = response.data));
            axios({
            url: 'http://localhost:3000/api/download/' + addToString,
            method: 'GET',
            responseType: 'blob', // Important
                }).then((response) => {
                FileDownload(response.data, 'GRN.fishies.zip');
            });
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

  #reset{
      position: relative;
      left:19%;
      transform: translate(-50%, -2000%)
  }

  #download{
      position: relative;
      left:13.9%;
      transform: translate(-50%, -2400%)
  }

</style>