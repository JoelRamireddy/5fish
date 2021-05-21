<template>
<div class = "everything">
  <div class="cascading-dropdown">
      
      <div class="dropdown">
          <span>Continent:</span>
          <select v-model="selectedContinent">
              <option value="">Select a Continent</option>
              <option v-bind:name = "place.default_location_name" v-bind:value = "place.grn_location_id" v-for="place in places" v-bind:key="place.default_location_name">{{place.default_location_name}}</option>
          </select>
      </div>
      <div class="dropdown">
          <span>Country:</span>
          <select :disabled="countries.length == 0" v-model="selectedCountry">
              <option value="">Select a Country</option>
              <option v-bind:value = "country.grn_location_id" v-for="country in countries" v-bind:key="country.default_location_name">{{country.default_location_name}}</option>
          </select>
      </div>
      <div class="dropdown">
          <span>Language:</span>
          <select :disabled="languages.length == 0" v-model="selectedLang">
              <option value="">Select a Language</option>
              <option v-bind:id = "language.langID" v-bind:value = "language.langID" v-for="language in languages" v-bind:key="language.langName">{{language.langName}}</option>
          </select>
      </div>
  </div>
  <div class="container">
    <ul id="lister">
      <li v-for="program in programs" v-bind:key="program.progName">
        <input type="checkbox" v-bind:id = "program.progID" v-model="checkedBoxes" :value="program.progID + '= ' + program.progName  + '-' + document.getElementById(selectedLang)">
        {{program.progName}}
      </li>
    </ul>
  </div>
  <div class = "button">
    <button v-on:click = "sendData">Get Programs</button>
  </div>
  <cart ref = "form" v-bind:checkedBoxes = "checkedBoxes"/>
  <button id = "reset" v-on:click = "emptyCart">Reset Cart</button>
</div>

</template>

<script>
import cart from '~/components/cart';
export default {
data: function() {
    return {
      places: [],
      countries: [],
      languages: [],
      programs: [],
      checkedBoxes: [],
      selectedContinent: "",
      selectedCountry: "",
      selectedLang: "",
      PORT_NUMBER : "3000"
    }
  },
  watch: {
    selectedContinent: function() {
      // Clear previously selected values
      this.countries = [];
      this.languages = [];
      this.selectedCountry = "";
      // Populate list of countries in the second dropdown
      const axios = require('axios');
      axios.get('http://localhost:3000/api/country/' + (this.selectedContinent).toString())
      .then(response => (this.countries = response.data));
      
    },
    selectedCountry: function() {
      // Clear previously selected values
      this.languages = [];
      // Now we have a continent and country. Populate list of languages in the third dropdown
      const axios = require('axios');
      axios.get('http://localhost:3000/api/languages/' + (this.selectedCountry).toString()).then(response => (this.languages = response.data));
    },
    selectedLang: function() {
      console.log("here");  
      const axios = require('axios');
      console.log((this))
      axios.get('http://localhost:3000/api/programs/' + (this.selectedLang).toString()).then(response => (this.programs = response.data));
      console.log((this.selectedLang).toString())
    }
},
created(){
    const axios = require('axios');
    axios.get('http://localhost:3000/api/region/')
    .then(response => (this.places = response.data));
},
methods: {
  sendData: function(){
    this.$refs.form.updateCart()
  },
  emptyCart : function(){
            this.$refs.form.resetCart();
            this.checkedBoxes = [];
  },
},
components:{
  cart
}
}
</script>

<style>
.everything{

    justify-content: center;
    align-content: center;
    align-items: center;
    height: 100%;
}
.cascading-dropdown{
    display: flex;
    justify-content: center;
    border: 5px solid #526488;
    align-content: center;
    align-items: center;
}

.dropdown{
    padding: 20px;
    position: relative;
    display:inline-block;
    
}

.button{
    position: relative;
    left: 50%;
     transform: translate(-3%, 0%);
}

.container { 

  border:2px solid #526488; 
  width:500px; 
  height: 350px;
  overflow-y: scroll;
  position: relative;
  display: inline-block;
  left: 0%;
  transform: translate(0%, 7%);}

#reset{
      position: relative;
      left:50%;
      transform: translate(-50%, -2000%)
  }

</style>