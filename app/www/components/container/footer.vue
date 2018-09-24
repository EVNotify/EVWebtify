<template>
    <v-footer app fixed>
      <span>&copy;{{ translated.COPYRIGHT_NOTE }}</span>
    </v-footer>
</template>

<script>
import translation from './../modules/translation.vue';

export default {
    data() {
        return {
            translated: {}
        };
    },
    created() {
        this.translated = translation.translatePage();
    }
}
</script>

