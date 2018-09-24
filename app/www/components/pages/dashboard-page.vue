<template>
  <v-app id="inspire" dark>
    <page-drawer></page-drawer>
    <v-content>
      <v-container fluid fill-height>
        <v-layout justify-center align-center>
        </v-layout>
      </v-container>
    </v-content>
    <page-footer></page-footer>
  </v-app>
</template>

<script>
import pageDrawer from './../container/drawer.vue';
import pageFooter from './../container/footer.vue';

  export default {
    components: {
        pageDrawer,
        pageFooter
    }
  }
</script>