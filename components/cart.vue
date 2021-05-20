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
            total : []
        }

    },
    methods : {
        updateCart : function(){
            for (var i = 0; i < this.checkedBoxes.length; i++){
                this.total.push(this.checkedBoxes[i]);
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