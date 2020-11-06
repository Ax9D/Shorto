import Vue from 'vue'
import App from './App.vue'
import router from './router'

import {VueReCaptcha} from 'vue-recaptcha-v3'

Vue.config.productionTip = false

Vue.use(VueReCaptcha,{
  siteKey:'6LekzN8ZAAAAAMze_DCGKta65Iv3fNnZCA86L9C4',
  loaderOptions: {
    useRecaptchaNet: true
  }
});
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
