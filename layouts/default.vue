<template>
  <div id = "whole">
    <AppHeader />
    <Nuxt />
  </div>
</template>

<script>
import AppHeader from '../components/AppHeader';

export default{
    components: {
      AppHeader
    }
}
</script>


<style>
.whole{
  height:100%;
}
</style>
