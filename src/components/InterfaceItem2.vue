<template>
    <div :id="partName" v-bind:class="{'.selectedDiv': selected}">
    <button v-bind:class="{'btn-dark': selected, 'btn-secondary': !selected}" class="btn" @click="click">{{partName}}</button>
    </div>
</template>

<script>
export default {
  name: 'InterfaceItem2',
  props: {partName:String},
  methods: {
    click()
    {
        this.$emit('send',this.partName)
        this.selected = !this.selected;
    },
    reset()
    {
        if (this.selected) this.selected = false;
    }
  },
  data() {return {selected: false}},
}
</script>

<style scoped>
button{height: 5em; width: 100%;}
.selectedDiv{border-style: dotted;}
.btn-dark{color:blueviolet;}
</style>
