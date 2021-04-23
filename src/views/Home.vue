<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import {readCsv} from '@/utils/csvHelper.js'

export default {
  name: 'Home',
  components: {
    HelloWorld
  }
}

console.log(readCsv('Tank_Assembly_J'))


</script>
