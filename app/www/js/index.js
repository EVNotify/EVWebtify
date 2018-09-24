import VueResource from 'vue-resource';
import App from './../components/pages/App.vue';
import LoginPage from './../components/pages/login-page.vue';
import DashboardPage from './../components/pages/dashboard-page.vue';

Vue.use(VueResource);
Vue.use(VueRouter);

// for session support
Vue.http.options.credentials = true;

var router = new VueRouter({
    routes: [{
        path: '/',
        component: LoginPage
    },{
        path: '/dashboard',
        component: DashboardPage
    }]
});

// the vue instance
var vm = new Vue({
    el: '#app',
    data() {
        return {
            deviceReady: false
        };
    },
    components: {
        'app': App,
        'login-page': LoginPage,
        'dashboard-page': DashboardPage
    },
    router,
    render: function(h) {
        return h(App);
    }
});

// apply event listener for deviceready
document.addEventListener('deviceready', () => vm.deviceReady = true);
