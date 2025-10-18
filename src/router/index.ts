import {createRouter, createWebHistory} from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import DrillsView from '@/views/DrillsView.vue';
import EditDrillView from '@/views/EditDrillView.vue';
import RandomizerView from '@/views/RandomizerView.vue';
import SplashView from '@/views/SplashView.vue';


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {path: '/', name: 'home', component: HomeView},
        {path: '/drills', name: 'drills', component: DrillsView},
        {path: '/drills/:id', name: 'edit-drill', component: EditDrillView, props: true},
        {path: '/random', name: 'random', component: RandomizerView},
        { path: '/splash', name: 'splash', component: SplashView }
    ]
});


export default router;