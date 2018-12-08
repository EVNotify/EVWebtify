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
                                <v-form v-model="valid">
                                    <v-text-field prepend-icon="person" v-model="userForm.mail" :label="translated.MAIL" :rules="mailRules" :error-messages="mailError" @keyup="mailError=''"
                                        type="text">
                                    </v-text-field>
                                    <v-text-field prepend-icon="lock" v-model="userForm.password" :label="translated.PASSWORD" :rules="passwordRules" :error-messages="passwordError" @keyup="passwordError=''"
                                        type="password">
                                    </v-text-field>
                                </v-form>
                            </v-card-text>
                            <v-card-actions>
                                <v-btn @click="register" :disabled="!valid || !userForm.mail || !userForm.password">Registrieren</v-btn>
                                <v-spacer></v-spacer>
                                <v-btn @click="login" :disabled="!valid || !userForm.mail || !userForm.password">{{ translated.LOGIN }}</v-btn>
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
                userForm: {},
                valid: true,
                mailError: '',
                passwordError: '',
                mailRules: [
                    v => {
                        if (!v || !v.length) return true;
                        return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v) || this.translated.INVALID_MAIL;
                    }
                ],
                passwordRules: [
                    v => {
                        if (!v || !v.length) return true;
                        return v.length >= 6 || this.translated.INVALID_PASSWORD;
                    }
                ]
            };
        },
        methods: {
            errorHandler(errObj) {
                if (!errObj || !errObj.body || !errObj.body.error || !errObj.body.error.code) return this.mailError = this.translated.UNKNOWN_ERROR;

                switch (errObj.body.error.code) {
                    case 1700:
                        this.mailError = this.translated.WRONG_MAIL;
                        break;
                    case 1800:
                        this.passwordError = this.translated.WRONG_PASSWORD;
                        break;
                    default:
                        this.mailError = this.translated.UNKNOWN_ERROR;
                        break;
                }
            },
            login() {
                var self = this;

                http.sendRequest('POST', 'web/login', self.userForm, err => {
                    if (!err) self.$router.push('/dashboard');
                    else self.errorHandler(err);
                });
            },
            register() {
                var self = this;

                http.sendRequest('POST', 'web/register', self.userForm, err => {
                    if (!err) self.$router.push('/dashboard');
                    else self.errorHandler(err);
                });
            }
        },
        created() {
            this.translated = translation.translatePage();
        }
    }
</script>