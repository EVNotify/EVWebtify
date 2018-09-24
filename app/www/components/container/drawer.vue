<template>
    <div>
        <v-navigation-drawer v-model="drawer" clipped fixed app>
            <v-toolbar flat class="transparent">
                <v-list class="pa-0">
                    <v-list-tile avatar>
                        <v-list-tile-avatar>
                            <img :src="avatarURL">
                        </v-list-tile-avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>{{ mail }}</v-list-tile-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </v-list>
                <v-list-tile @click="test">
                    <v-list-tile-action>
                        <v-icon>settings</v-icon>
                    </v-list-tile-action>
                </v-list-tile>
            </v-toolbar>
            <v-list dense>
                <v-list-tile @click="test">
                    <v-list-tile-action>
                        <v-icon>dashboard</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ translated.DASHBOARD }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click="test">
                    <v-list-tile-action>
                        <v-icon>devices</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ translated.DEVICES }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click="test">
                    <v-list-tile-action>
                        <v-icon>ev_station</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ translated.EV_STATIONS }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click="test">
                    <v-list-tile-action>
                        <v-icon>view_list</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ translated.LOGS }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
                <v-list-tile @click="test">
                    <v-list-tile-action>
                        <v-icon>show_chart</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-content>
                        <v-list-tile-title>{{ translated.STATISTICS }}</v-list-tile-title>
                    </v-list-tile-content>
                </v-list-tile>
            </v-list>
        </v-navigation-drawer>
        <v-toolbar app fixed clipped-left>
            <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
            <v-toolbar-title>EVWebtify</v-toolbar-title>
        </v-toolbar>
    </div>
</template>

<script>
    import storage from './../modules/storage.vue';
    import translation from './../modules/translation.vue';

    export default {
        data() {
            return {
                drawer: false,
                mail: storage.getValue('mail'),
                avatarURL: 'https://robohash.org/' + this.mail,
                translated: {}
            };
        },
        methods: {
            test() {
                console.log('click')
            }
        },
        created() {
            this.translated = translation.translatePage();
        }
    }
</script>