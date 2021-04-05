import Vue from 'vue'
import vb from 'vue-babylonjs'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false
Vue.use(vb)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
