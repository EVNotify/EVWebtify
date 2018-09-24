<template>
    <v-app id="inspire" dark>
        <v-content>
            <v-container fluid fill-height>
                <v-layout align-center justify-center>
                    <v-flex xs12 sm8 md4>
                        <v-card class="elevation-12">
                            <v-toolbar>
                                <v-toolbar-title>{{ translated.LOGIN }}</v-toolbar-title>
                                <v-spacer></v-spacer>
                            </v-toolbar>
                            <v-card-text>
                                <v-form>
                                    <v-text-field prepend-icon="person" v-model="loginForm.mail" :label="translated.MAIL"
                                        type="text">
                                    </v-text-field>
                                    <v-text-field prepend-icon="lock" v-model="loginForm.password" :label="translated.PASSWORD"
                                        type="password">
                                    </v-text-field>
                                </v-form>
                            </v-card-text>
                            <v-card-actions>
                                <v-spacer></v-spacer>
                                <v-btn @click="login">{{ translated.LOGIN }}</v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
    </v-app>
</template>

<script>
    import translation from './../modules/translation.vue';
    import http from './../modules/http.vue';

    export default {
        data() {
            return {
                translated: {},
                loginForm: {
                    mail: '',
                    password: ''
                }
            };
        },
        methods: {
            login() {
                // TODO send login request
            }
        },
        created() {
            this.translated = translation.translatePage();
        }
    }
</script>