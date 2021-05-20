<template>
  <div class="something">
    <!-- <ul id="lister">
      <li v-for="program in programs" v-bind:key="program.progName">
        <input type="checkbox" v-bind:id = "program.progID" v-model="checkedBoxes" :value="program.progID">
        {{program.progName}}
      </li>
    </ul> -->
    <span>{{checkedBoxes}}</span>
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
            //split into two arrays 
            for (var i = 0; i < this.checkedBoxes.length; i++){
                //split based on the location of "=" 
                var temp = this.checkedBoxes[i];
                var ind = temp.indexOf("=");
                var tempID = temp.substring(0, ind);
                var tempName = temp.substring(ind+1, temp.length);
                progIDs.push(tempID);
                names.push(tempName);
            }
            console.log(this.total)
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
  left: 50%;
  transform: translate(-50%, 0%);}
</style>