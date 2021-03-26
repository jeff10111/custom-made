<template>
  <div id="app">
    <SelectionInterface aaa="useless string"/>
  </div>
</template>

<script>
import SelectionInterface from './components/SelectionInterface.vue'

export default {
  name: 'App',
  components: {
    SelectionInterface
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
