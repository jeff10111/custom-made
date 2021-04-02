import Vue from 'vue'
import vb from 'vue-babylonjs'
import * as BABYLON from 'babylonjs'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false
Vue.use(vb)
Vue.use(BABYLON)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
