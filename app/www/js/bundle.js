(function () {
    'use strict';

    /*!
     * vue-resource v1.5.1
     * https://github.com/pagekit/vue-resource
     * Released under the MIT License.
     */

    /**
     * Promises/A+ polyfill v1.1.4 (https://github.com/bramstein/promis)
     */

    var RESOLVED = 0;
    var REJECTED = 1;
    var PENDING = 2;

    function Promise$1(executor) {

        this.state = PENDING;
        this.value = undefined;
        this.deferred = [];

        var promise = this;

        try {
            executor(function (x) {
                promise.resolve(x);
            }, function (r) {
                promise.reject(r);
            });
        } catch (e) {
            promise.reject(e);
        }
    }

    Promise$1.reject = function (r) {
        return new Promise$1(function (resolve, reject) {
            reject(r);
        });
    };

    Promise$1.resolve = function (x) {
        return new Promise$1(function (resolve, reject) {
            resolve(x);
        });
    };

    Promise$1.all = function all(iterable) {
        return new Promise$1(function (resolve, reject) {
            var count = 0, result = [];

            if (iterable.length === 0) {
                resolve(result);
            }

            function resolver(i) {
                return function (x) {
                    result[i] = x;
                    count += 1;

                    if (count === iterable.length) {
                        resolve(result);
                    }
                };
            }

            for (var i = 0; i < iterable.length; i += 1) {
                Promise$1.resolve(iterable[i]).then(resolver(i), reject);
            }
        });
    };

    Promise$1.race = function race(iterable) {
        return new Promise$1(function (resolve, reject) {
            for (var i = 0; i < iterable.length; i += 1) {
                Promise$1.resolve(iterable[i]).then(resolve, reject);
            }
        });
    };

    var p = Promise$1.prototype;

    p.resolve = function resolve(x) {
        var promise = this;

        if (promise.state === PENDING) {
            if (x === promise) {
                throw new TypeError('Promise settled with itself.');
            }

            var called = false;

            try {
                var then = x && x['then'];

                if (x !== null && typeof x === 'object' && typeof then === 'function') {
                    then.call(x, function (x) {
                        if (!called) {
                            promise.resolve(x);
                        }
                        called = true;

                    }, function (r) {
                        if (!called) {
                            promise.reject(r);
                        }
                        called = true;
                    });
                    return;
                }
            } catch (e) {
                if (!called) {
                    promise.reject(e);
                }
                return;
            }

            promise.state = RESOLVED;
            promise.value = x;
            promise.notify();
        }
    };

    p.reject = function reject(reason) {
        var promise = this;

        if (promise.state === PENDING) {
            if (reason === promise) {
                throw new TypeError('Promise settled with itself.');
            }

            promise.state = REJECTED;
            promise.value = reason;
            promise.notify();
        }
    };

    p.notify = function notify() {
        var promise = this;

        nextTick(function () {
            if (promise.state !== PENDING) {
                while (promise.deferred.length) {
                    var deferred = promise.deferred.shift(),
                        onResolved = deferred[0],
                        onRejected = deferred[1],
                        resolve = deferred[2],
                        reject = deferred[3];

                    try {
                        if (promise.state === RESOLVED) {
                            if (typeof onResolved === 'function') {
                                resolve(onResolved.call(undefined, promise.value));
                            } else {
                                resolve(promise.value);
                            }
                        } else if (promise.state === REJECTED) {
                            if (typeof onRejected === 'function') {
                                resolve(onRejected.call(undefined, promise.value));
                            } else {
                                reject(promise.value);
                            }
                        }
                    } catch (e) {
                        reject(e);
                    }
                }
            }
        });
    };

    p.then = function then(onResolved, onRejected) {
        var promise = this;

        return new Promise$1(function (resolve, reject) {
            promise.deferred.push([onResolved, onRejected, resolve, reject]);
            promise.notify();
        });
    };

    p.catch = function (onRejected) {
        return this.then(undefined, onRejected);
    };

    /**
     * Promise adapter.
     */

    if (typeof Promise === 'undefined') {
        window.Promise = Promise$1;
    }

    function PromiseObj(executor, context) {

        if (executor instanceof Promise) {
            this.promise = executor;
        } else {
            this.promise = new Promise(executor.bind(context));
        }

        this.context = context;
    }

    PromiseObj.all = function (iterable, context) {
        return new PromiseObj(Promise.all(iterable), context);
    };

    PromiseObj.resolve = function (value, context) {
        return new PromiseObj(Promise.resolve(value), context);
    };

    PromiseObj.reject = function (reason, context) {
        return new PromiseObj(Promise.reject(reason), context);
    };

    PromiseObj.race = function (iterable, context) {
        return new PromiseObj(Promise.race(iterable), context);
    };

    var p$1 = PromiseObj.prototype;

    p$1.bind = function (context) {
        this.context = context;
        return this;
    };

    p$1.then = function (fulfilled, rejected) {

        if (fulfilled && fulfilled.bind && this.context) {
            fulfilled = fulfilled.bind(this.context);
        }

        if (rejected && rejected.bind && this.context) {
            rejected = rejected.bind(this.context);
        }

        return new PromiseObj(this.promise.then(fulfilled, rejected), this.context);
    };

    p$1.catch = function (rejected) {

        if (rejected && rejected.bind && this.context) {
            rejected = rejected.bind(this.context);
        }

        return new PromiseObj(this.promise.catch(rejected), this.context);
    };

    p$1.finally = function (callback) {

        return this.then(function (value) {
            callback.call(this);
            return value;
        }, function (reason) {
            callback.call(this);
            return Promise.reject(reason);
        }
        );
    };

    /**
     * Utility functions.
     */

    var ref = {};
    var hasOwnProperty = ref.hasOwnProperty;
    var ref$1 = [];
    var slice = ref$1.slice;
    var debug = false, ntick;

    var inBrowser = typeof window !== 'undefined';

    function Util (ref) {
        var config = ref.config;
        var nextTick = ref.nextTick;

        ntick = nextTick;
        debug = config.debug || !config.silent;
    }

    function warn(msg) {
        if (typeof console !== 'undefined' && debug) {
            console.warn('[VueResource warn]: ' + msg);
        }
    }

    function error(msg) {
        if (typeof console !== 'undefined') {
            console.error(msg);
        }
    }

    function nextTick(cb, ctx) {
        return ntick(cb, ctx);
    }

    function trim(str) {
        return str ? str.replace(/^\s*|\s*$/g, '') : '';
    }

    function trimEnd(str, chars) {

        if (str && chars === undefined) {
            return str.replace(/\s+$/, '');
        }

        if (!str || !chars) {
            return str;
        }

        return str.replace(new RegExp(("[" + chars + "]+$")), '');
    }

    function toLower(str) {
        return str ? str.toLowerCase() : '';
    }

    function toUpper(str) {
        return str ? str.toUpperCase() : '';
    }

    var isArray = Array.isArray;

    function isString(val) {
        return typeof val === 'string';
    }

    function isFunction(val) {
        return typeof val === 'function';
    }

    function isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }

    function isPlainObject(obj) {
        return isObject(obj) && Object.getPrototypeOf(obj) == Object.prototype;
    }

    function isBlob(obj) {
        return typeof Blob !== 'undefined' && obj instanceof Blob;
    }

    function isFormData(obj) {
        return typeof FormData !== 'undefined' && obj instanceof FormData;
    }

    function when(value, fulfilled, rejected) {

        var promise = PromiseObj.resolve(value);

        if (arguments.length < 2) {
            return promise;
        }

        return promise.then(fulfilled, rejected);
    }

    function options(fn, obj, opts) {

        opts = opts || {};

        if (isFunction(opts)) {
            opts = opts.call(obj);
        }

        return merge(fn.bind({$vm: obj, $options: opts}), fn, {$options: opts});
    }

    function each(obj, iterator) {

        var i, key;

        if (isArray(obj)) {
            for (i = 0; i < obj.length; i++) {
                iterator.call(obj[i], obj[i], i);
            }
        } else if (isObject(obj)) {
            for (key in obj) {
                if (hasOwnProperty.call(obj, key)) {
                    iterator.call(obj[key], obj[key], key);
                }
            }
        }

        return obj;
    }

    var assign = Object.assign || _assign;

    function merge(target) {

        var args = slice.call(arguments, 1);

        args.forEach(function (source) {
            _merge(target, source, true);
        });

        return target;
    }

    function defaults(target) {

        var args = slice.call(arguments, 1);

        args.forEach(function (source) {

            for (var key in source) {
                if (target[key] === undefined) {
                    target[key] = source[key];
                }
            }

        });

        return target;
    }

    function _assign(target) {

        var args = slice.call(arguments, 1);

        args.forEach(function (source) {
            _merge(target, source);
        });

        return target;
    }

    function _merge(target, source, deep) {
        for (var key in source) {
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key])) {
                    target[key] = {};
                }
                if (isArray(source[key]) && !isArray(target[key])) {
                    target[key] = [];
                }
                _merge(target[key], source[key], deep);
            } else if (source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    }

    /**
     * Root Prefix Transform.
     */

    function root (options$$1, next) {

        var url = next(options$$1);

        if (isString(options$$1.root) && !/^(https?:)?\//.test(url)) {
            url = trimEnd(options$$1.root, '/') + '/' + url;
        }

        return url;
    }

    /**
     * Query Parameter Transform.
     */

    function query (options$$1, next) {

        var urlParams = Object.keys(Url.options.params), query = {}, url = next(options$$1);

        each(options$$1.params, function (value, key) {
            if (urlParams.indexOf(key) === -1) {
                query[key] = value;
            }
        });

        query = Url.params(query);

        if (query) {
            url += (url.indexOf('?') == -1 ? '?' : '&') + query;
        }

        return url;
    }

    /**
     * URL Template v2.0.6 (https://github.com/bramstein/url-template)
     */

    function expand(url, params, variables) {

        var tmpl = parse(url), expanded = tmpl.expand(params);

        if (variables) {
            variables.push.apply(variables, tmpl.vars);
        }

        return expanded;
    }

    function parse(template) {

        var operators = ['+', '#', '.', '/', ';', '?', '&'], variables = [];

        return {
            vars: variables,
            expand: function expand(context) {
                return template.replace(/\{([^{}]+)\}|([^{}]+)/g, function (_, expression, literal) {
                    if (expression) {

                        var operator = null, values = [];

                        if (operators.indexOf(expression.charAt(0)) !== -1) {
                            operator = expression.charAt(0);
                            expression = expression.substr(1);
                        }

                        expression.split(/,/g).forEach(function (variable) {
                            var tmp = /([^:*]*)(?::(\d+)|(\*))?/.exec(variable);
                            values.push.apply(values, getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
                            variables.push(tmp[1]);
                        });

                        if (operator && operator !== '+') {

                            var separator = ',';

                            if (operator === '?') {
                                separator = '&';
                            } else if (operator !== '#') {
                                separator = operator;
                            }

                            return (values.length !== 0 ? operator : '') + values.join(separator);
                        } else {
                            return values.join(',');
                        }

                    } else {
                        return encodeReserved(literal);
                    }
                });
            }
        };
    }

    function getValues(context, operator, key, modifier) {

        var value = context[key], result = [];

        if (isDefined(value) && value !== '') {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                value = value.toString();

                if (modifier && modifier !== '*') {
                    value = value.substring(0, parseInt(modifier, 10));
                }

                result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : null));
            } else {
                if (modifier === '*') {
                    if (Array.isArray(value)) {
                        value.filter(isDefined).forEach(function (value) {
                            result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : null));
                        });
                    } else {
                        Object.keys(value).forEach(function (k) {
                            if (isDefined(value[k])) {
                                result.push(encodeValue(operator, value[k], k));
                            }
                        });
                    }
                } else {
                    var tmp = [];

                    if (Array.isArray(value)) {
                        value.filter(isDefined).forEach(function (value) {
                            tmp.push(encodeValue(operator, value));
                        });
                    } else {
                        Object.keys(value).forEach(function (k) {
                            if (isDefined(value[k])) {
                                tmp.push(encodeURIComponent(k));
                                tmp.push(encodeValue(operator, value[k].toString()));
                            }
                        });
                    }

                    if (isKeyOperator(operator)) {
                        result.push(encodeURIComponent(key) + '=' + tmp.join(','));
                    } else if (tmp.length !== 0) {
                        result.push(tmp.join(','));
                    }
                }
            }
        } else {
            if (operator === ';') {
                result.push(encodeURIComponent(key));
            } else if (value === '' && (operator === '&' || operator === '?')) {
                result.push(encodeURIComponent(key) + '=');
            } else if (value === '') {
                result.push('');
            }
        }

        return result;
    }

    function isDefined(value) {
        return value !== undefined && value !== null;
    }

    function isKeyOperator(operator) {
        return operator === ';' || operator === '&' || operator === '?';
    }

    function encodeValue(operator, value, key) {

        value = (operator === '+' || operator === '#') ? encodeReserved(value) : encodeURIComponent(value);

        if (key) {
            return encodeURIComponent(key) + '=' + value;
        } else {
            return value;
        }
    }

    function encodeReserved(str) {
        return str.split(/(%[0-9A-Fa-f]{2})/g).map(function (part) {
            if (!/%[0-9A-Fa-f]/.test(part)) {
                part = encodeURI(part);
            }
            return part;
        }).join('');
    }

    /**
     * URL Template (RFC 6570) Transform.
     */

    function template (options) {

        var variables = [], url = expand(options.url, options.params, variables);

        variables.forEach(function (key) {
            delete options.params[key];
        });

        return url;
    }

    /**
     * Service for URL templating.
     */

    function Url(url, params) {

        var self = this || {}, options$$1 = url, transform;

        if (isString(url)) {
            options$$1 = {url: url, params: params};
        }

        options$$1 = merge({}, Url.options, self.$options, options$$1);

        Url.transforms.forEach(function (handler) {

            if (isString(handler)) {
                handler = Url.transform[handler];
            }

            if (isFunction(handler)) {
                transform = factory(handler, transform, self.$vm);
            }

        });

        return transform(options$$1);
    }

    /**
     * Url options.
     */

    Url.options = {
        url: '',
        root: null,
        params: {}
    };

    /**
     * Url transforms.
     */

    Url.transform = {template: template, query: query, root: root};
    Url.transforms = ['template', 'query', 'root'];

    /**
     * Encodes a Url parameter string.
     *
     * @param {Object} obj
     */

    Url.params = function (obj) {

        var params = [], escape = encodeURIComponent;

        params.add = function (key, value) {

            if (isFunction(value)) {
                value = value();
            }

            if (value === null) {
                value = '';
            }

            this.push(escape(key) + '=' + escape(value));
        };

        serialize(params, obj);

        return params.join('&').replace(/%20/g, '+');
    };

    /**
     * Parse a URL and return its components.
     *
     * @param {String} url
     */

    Url.parse = function (url) {

        var el = document.createElement('a');

        if (document.documentMode) {
            el.href = url;
            url = el.href;
        }

        el.href = url;

        return {
            href: el.href,
            protocol: el.protocol ? el.protocol.replace(/:$/, '') : '',
            port: el.port,
            host: el.host,
            hostname: el.hostname,
            pathname: el.pathname.charAt(0) === '/' ? el.pathname : '/' + el.pathname,
            search: el.search ? el.search.replace(/^\?/, '') : '',
            hash: el.hash ? el.hash.replace(/^#/, '') : ''
        };
    };

    function factory(handler, next, vm) {
        return function (options$$1) {
            return handler.call(vm, options$$1, next);
        };
    }

    function serialize(params, obj, scope) {

        var array = isArray(obj), plain = isPlainObject(obj), hash;

        each(obj, function (value, key) {

            hash = isObject(value) || isArray(value);

            if (scope) {
                key = scope + '[' + (plain || hash ? key : '') + ']';
            }

            if (!scope && array) {
                params.add(value.name, value.value);
            } else if (hash) {
                serialize(params, value, key);
            } else {
                params.add(key, value);
            }
        });
    }

    /**
     * XDomain client (Internet Explorer).
     */

    function xdrClient (request) {
        return new PromiseObj(function (resolve) {

            var xdr = new XDomainRequest(), handler = function (ref) {
                    var type = ref.type;


                    var status = 0;

                    if (type === 'load') {
                        status = 200;
                    } else if (type === 'error') {
                        status = 500;
                    }

                    resolve(request.respondWith(xdr.responseText, {status: status}));
                };

            request.abort = function () { return xdr.abort(); };

            xdr.open(request.method, request.getUrl());

            if (request.timeout) {
                xdr.timeout = request.timeout;
            }

            xdr.onload = handler;
            xdr.onabort = handler;
            xdr.onerror = handler;
            xdr.ontimeout = handler;
            xdr.onprogress = function () {};
            xdr.send(request.getBody());
        });
    }

    /**
     * CORS Interceptor.
     */

    var SUPPORTS_CORS = inBrowser && 'withCredentials' in new XMLHttpRequest();

    function cors (request) {

        if (inBrowser) {

            var orgUrl = Url.parse(location.href);
            var reqUrl = Url.parse(request.getUrl());

            if (reqUrl.protocol !== orgUrl.protocol || reqUrl.host !== orgUrl.host) {

                request.crossOrigin = true;
                request.emulateHTTP = false;

                if (!SUPPORTS_CORS) {
                    request.client = xdrClient;
                }
            }
        }

    }

    /**
     * Form data Interceptor.
     */

    function form (request) {

        if (isFormData(request.body)) {
            request.headers.delete('Content-Type');
        } else if (isObject(request.body) && request.emulateJSON) {
            request.body = Url.params(request.body);
            request.headers.set('Content-Type', 'application/x-www-form-urlencoded');
        }

    }

    /**
     * JSON Interceptor.
     */

    function json (request) {

        var type = request.headers.get('Content-Type') || '';

        if (isObject(request.body) && type.indexOf('application/json') === 0) {
            request.body = JSON.stringify(request.body);
        }

        return function (response) {

            return response.bodyText ? when(response.text(), function (text) {

                var type = response.headers.get('Content-Type') || '';

                if (type.indexOf('application/json') === 0 || isJson(text)) {

                    try {
                        response.body = JSON.parse(text);
                    } catch (e) {
                        response.body = null;
                    }

                } else {
                    response.body = text;
                }

                return response;

            }) : response;

        };
    }

    function isJson(str) {

        var start = str.match(/^\s*(\[|\{)/);
        var end = {'[': /]\s*$/, '{': /}\s*$/};

        return start && end[start[1]].test(str);
    }

    /**
     * JSONP client (Browser).
     */

    function jsonpClient (request) {
        return new PromiseObj(function (resolve) {

            var name = request.jsonp || 'callback', callback = request.jsonpCallback || '_jsonp' + Math.random().toString(36).substr(2), body = null, handler, script;

            handler = function (ref) {
                var type = ref.type;


                var status = 0;

                if (type === 'load' && body !== null) {
                    status = 200;
                } else if (type === 'error') {
                    status = 500;
                }

                if (status && window[callback]) {
                    delete window[callback];
                    document.body.removeChild(script);
                }

                resolve(request.respondWith(body, {status: status}));
            };

            window[callback] = function (result) {
                body = JSON.stringify(result);
            };

            request.abort = function () {
                handler({type: 'abort'});
            };

            request.params[name] = callback;

            if (request.timeout) {
                setTimeout(request.abort, request.timeout);
            }

            script = document.createElement('script');
            script.src = request.getUrl();
            script.type = 'text/javascript';
            script.async = true;
            script.onload = handler;
            script.onerror = handler;

            document.body.appendChild(script);
        });
    }

    /**
     * JSONP Interceptor.
     */

    function jsonp (request) {

        if (request.method == 'JSONP') {
            request.client = jsonpClient;
        }

    }

    /**
     * Before Interceptor.
     */

    function before (request) {

        if (isFunction(request.before)) {
            request.before.call(this, request);
        }

    }

    /**
     * HTTP method override Interceptor.
     */

    function method (request) {

        if (request.emulateHTTP && /^(PUT|PATCH|DELETE)$/i.test(request.method)) {
            request.headers.set('X-HTTP-Method-Override', request.method);
            request.method = 'POST';
        }

    }

    /**
     * Header Interceptor.
     */

    function header (request) {

        var headers = assign({}, Http.headers.common,
            !request.crossOrigin ? Http.headers.custom : {},
            Http.headers[toLower(request.method)]
        );

        each(headers, function (value, name) {
            if (!request.headers.has(name)) {
                request.headers.set(name, value);
            }
        });

    }

    /**
     * XMLHttp client (Browser).
     */

    function xhrClient (request) {
        return new PromiseObj(function (resolve) {

            var xhr = new XMLHttpRequest(), handler = function (event) {

                    var response = request.respondWith(
                    'response' in xhr ? xhr.response : xhr.responseText, {
                        status: xhr.status === 1223 ? 204 : xhr.status, // IE9 status bug
                        statusText: xhr.status === 1223 ? 'No Content' : trim(xhr.statusText)
                    });

                    each(trim(xhr.getAllResponseHeaders()).split('\n'), function (row) {
                        response.headers.append(row.slice(0, row.indexOf(':')), row.slice(row.indexOf(':') + 1));
                    });

                    resolve(response);
                };

            request.abort = function () { return xhr.abort(); };

            xhr.open(request.method, request.getUrl(), true);

            if (request.timeout) {
                xhr.timeout = request.timeout;
            }

            if (request.responseType && 'responseType' in xhr) {
                xhr.responseType = request.responseType;
            }

            if (request.withCredentials || request.credentials) {
                xhr.withCredentials = true;
            }

            if (!request.crossOrigin) {
                request.headers.set('X-Requested-With', 'XMLHttpRequest');
            }

            // deprecated use downloadProgress
            if (isFunction(request.progress) && request.method === 'GET') {
                xhr.addEventListener('progress', request.progress);
            }

            if (isFunction(request.downloadProgress)) {
                xhr.addEventListener('progress', request.downloadProgress);
            }

            // deprecated use uploadProgress
            if (isFunction(request.progress) && /^(POST|PUT)$/i.test(request.method)) {
                xhr.upload.addEventListener('progress', request.progress);
            }

            if (isFunction(request.uploadProgress) && xhr.upload) {
                xhr.upload.addEventListener('progress', request.uploadProgress);
            }

            request.headers.forEach(function (value, name) {
                xhr.setRequestHeader(name, value);
            });

            xhr.onload = handler;
            xhr.onabort = handler;
            xhr.onerror = handler;
            xhr.ontimeout = handler;
            xhr.send(request.getBody());
        });
    }

    /**
     * Http client (Node).
     */

    function nodeClient (request) {

        var client = require('got');

        return new PromiseObj(function (resolve) {

            var url = request.getUrl();
            var body = request.getBody();
            var method = request.method;
            var headers = {}, handler;

            request.headers.forEach(function (value, name) {
                headers[name] = value;
            });

            client(url, {body: body, method: method, headers: headers}).then(handler = function (resp) {

                var response = request.respondWith(resp.body, {
                    status: resp.statusCode,
                    statusText: trim(resp.statusMessage)
                });

                each(resp.headers, function (value, name) {
                    response.headers.set(name, value);
                });

                resolve(response);

            }, function (error$$1) { return handler(error$$1.response); });
        });
    }

    /**
     * Base client.
     */

    function Client (context) {

        var reqHandlers = [sendRequest], resHandlers = [];

        if (!isObject(context)) {
            context = null;
        }

        function Client(request) {
            while (reqHandlers.length) {

                var handler = reqHandlers.pop();

                if (isFunction(handler)) {

                    var response = (void 0), next = (void 0);

                    response = handler.call(context, request, function (val) { return next = val; }) || next;

                    if (isObject(response)) {
                        return new PromiseObj(function (resolve, reject) {

                            resHandlers.forEach(function (handler) {
                                response = when(response, function (response) {
                                    return handler.call(context, response) || response;
                                }, reject);
                            });

                            when(response, resolve, reject);

                        }, context);
                    }

                    if (isFunction(response)) {
                        resHandlers.unshift(response);
                    }

                } else {
                    warn(("Invalid interceptor of type " + (typeof handler) + ", must be a function"));
                }
            }
        }

        Client.use = function (handler) {
            reqHandlers.push(handler);
        };

        return Client;
    }

    function sendRequest(request) {

        var client = request.client || (inBrowser ? xhrClient : nodeClient);

        return client(request);
    }

    /**
     * HTTP Headers.
     */

    var Headers = function Headers(headers) {
        var this$1 = this;


        this.map = {};

        each(headers, function (value, name) { return this$1.append(name, value); });
    };

    Headers.prototype.has = function has (name) {
        return getName(this.map, name) !== null;
    };

    Headers.prototype.get = function get (name) {

        var list = this.map[getName(this.map, name)];

        return list ? list.join() : null;
    };

    Headers.prototype.getAll = function getAll (name) {
        return this.map[getName(this.map, name)] || [];
    };

    Headers.prototype.set = function set (name, value) {
        this.map[normalizeName(getName(this.map, name) || name)] = [trim(value)];
    };

    Headers.prototype.append = function append (name, value) {

        var list = this.map[getName(this.map, name)];

        if (list) {
            list.push(trim(value));
        } else {
            this.set(name, value);
        }
    };

    Headers.prototype.delete = function delete$1 (name) {
        delete this.map[getName(this.map, name)];
    };

    Headers.prototype.deleteAll = function deleteAll () {
        this.map = {};
    };

    Headers.prototype.forEach = function forEach (callback, thisArg) {
            var this$1 = this;

        each(this.map, function (list, name) {
            each(list, function (value) { return callback.call(thisArg, value, name, this$1); });
        });
    };

    function getName(map, name) {
        return Object.keys(map).reduce(function (prev, curr) {
            return toLower(name) === toLower(curr) ? curr : prev;
        }, null);
    }

    function normalizeName(name) {

        if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
            throw new TypeError('Invalid character in header field name');
        }

        return trim(name);
    }

    /**
     * HTTP Response.
     */

    var Response = function Response(body, ref) {
        var url = ref.url;
        var headers = ref.headers;
        var status = ref.status;
        var statusText = ref.statusText;


        this.url = url;
        this.ok = status >= 200 && status < 300;
        this.status = status || 0;
        this.statusText = statusText || '';
        this.headers = new Headers(headers);
        this.body = body;

        if (isString(body)) {

            this.bodyText = body;

        } else if (isBlob(body)) {

            this.bodyBlob = body;

            if (isBlobText(body)) {
                this.bodyText = blobText(body);
            }
        }
    };

    Response.prototype.blob = function blob () {
        return when(this.bodyBlob);
    };

    Response.prototype.text = function text () {
        return when(this.bodyText);
    };

    Response.prototype.json = function json () {
        return when(this.text(), function (text) { return JSON.parse(text); });
    };

    Object.defineProperty(Response.prototype, 'data', {

        get: function get() {
            return this.body;
        },

        set: function set(body) {
            this.body = body;
        }

    });

    function blobText(body) {
        return new PromiseObj(function (resolve) {

            var reader = new FileReader();

            reader.readAsText(body);
            reader.onload = function () {
                resolve(reader.result);
            };

        });
    }

    function isBlobText(body) {
        return body.type.indexOf('text') === 0 || body.type.indexOf('json') !== -1;
    }

    /**
     * HTTP Request.
     */

    var Request = function Request(options$$1) {

        this.body = null;
        this.params = {};

        assign(this, options$$1, {
            method: toUpper(options$$1.method || 'GET')
        });

        if (!(this.headers instanceof Headers)) {
            this.headers = new Headers(this.headers);
        }
    };

    Request.prototype.getUrl = function getUrl () {
        return Url(this);
    };

    Request.prototype.getBody = function getBody () {
        return this.body;
    };

    Request.prototype.respondWith = function respondWith (body, options$$1) {
        return new Response(body, assign(options$$1 || {}, {url: this.getUrl()}));
    };

    /**
     * Service for sending network requests.
     */

    var COMMON_HEADERS = {'Accept': 'application/json, text/plain, */*'};
    var JSON_CONTENT_TYPE = {'Content-Type': 'application/json;charset=utf-8'};

    function Http(options$$1) {

        var self = this || {}, client = Client(self.$vm);

        defaults(options$$1 || {}, self.$options, Http.options);

        Http.interceptors.forEach(function (handler) {

            if (isString(handler)) {
                handler = Http.interceptor[handler];
            }

            if (isFunction(handler)) {
                client.use(handler);
            }

        });

        return client(new Request(options$$1)).then(function (response) {

            return response.ok ? response : PromiseObj.reject(response);

        }, function (response) {

            if (response instanceof Error) {
                error(response);
            }

            return PromiseObj.reject(response);
        });
    }

    Http.options = {};

    Http.headers = {
        put: JSON_CONTENT_TYPE,
        post: JSON_CONTENT_TYPE,
        patch: JSON_CONTENT_TYPE,
        delete: JSON_CONTENT_TYPE,
        common: COMMON_HEADERS,
        custom: {}
    };

    Http.interceptor = {before: before, method: method, jsonp: jsonp, json: json, form: form, header: header, cors: cors};
    Http.interceptors = ['before', 'method', 'jsonp', 'json', 'form', 'header', 'cors'];

    ['get', 'delete', 'head', 'jsonp'].forEach(function (method$$1) {

        Http[method$$1] = function (url, options$$1) {
            return this(assign(options$$1 || {}, {url: url, method: method$$1}));
        };

    });

    ['post', 'put', 'patch'].forEach(function (method$$1) {

        Http[method$$1] = function (url, body, options$$1) {
            return this(assign(options$$1 || {}, {url: url, method: method$$1, body: body}));
        };

    });

    /**
     * Service for interacting with RESTful services.
     */

    function Resource(url, params, actions, options$$1) {

        var self = this || {}, resource = {};

        actions = assign({},
            Resource.actions,
            actions
        );

        each(actions, function (action, name) {

            action = merge({url: url, params: assign({}, params)}, options$$1, action);

            resource[name] = function () {
                return (self.$http || Http)(opts(action, arguments));
            };
        });

        return resource;
    }

    function opts(action, args) {

        var options$$1 = assign({}, action), params = {}, body;

        switch (args.length) {

            case 2:

                params = args[0];
                body = args[1];

                break;

            case 1:

                if (/^(POST|PUT|PATCH)$/i.test(options$$1.method)) {
                    body = args[0];
                } else {
                    params = args[0];
                }

                break;

            case 0:

                break;

            default:

                throw 'Expected up to 2 arguments [params, body], got ' + args.length + ' arguments';
        }

        options$$1.body = body;
        options$$1.params = assign({}, options$$1.params, params);

        return options$$1;
    }

    Resource.actions = {

        get: {method: 'GET'},
        save: {method: 'POST'},
        query: {method: 'GET'},
        update: {method: 'PUT'},
        remove: {method: 'DELETE'},
        delete: {method: 'DELETE'}

    };

    /**
     * Install plugin.
     */

    function plugin(Vue) {

        if (plugin.installed) {
            return;
        }

        Util(Vue);

        Vue.url = Url;
        Vue.http = Http;
        Vue.resource = Resource;
        Vue.Promise = PromiseObj;

        Object.defineProperties(Vue.prototype, {

            $url: {
                get: function get() {
                    return options(Vue.url, this, this.$options.url);
                }
            },

            $http: {
                get: function get() {
                    return options(Vue.http, this, this.$options.http);
                }
            },

            $resource: {
                get: function get() {
                    return Vue.resource.bind(this);
                }
            },

            $promise: {
                get: function get() {
                    var this$1 = this;

                    return function (executor) { return new Vue.Promise(executor, this$1); };
                }
            }

        });
    }

    if (typeof window !== 'undefined' && window.Vue) {
        window.Vue.use(plugin);
    }

    /* script */

    /* template */
    var __vue_render__ = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "div",
        { attrs: { id: "app" } },
        [_c("transition", { attrs: { name: "fade" } }, [_c("router-view")], 1)],
        1
      )
    };
    var __vue_staticRenderFns__ = [];
    __vue_render__._withStripped = true;

      /* style */
      const __vue_inject_styles__ = undefined;
      /* scoped */
      const __vue_scope_id__ = undefined;
      /* module identifier */
      const __vue_module_identifier__ = undefined;
      /* functional template */
      const __vue_is_functional_template__ = false;
      /* component normalizer */
      function __vue_normalize__(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/pages/App.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var App = __vue_normalize__(
        { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
        __vue_inject_styles__,
        {},
        __vue_scope_id__,
        __vue_is_functional_template__,
        __vue_module_identifier__,
        undefined,
        undefined
      );

    function _typeof(obj) {
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    //
    var script = {
      /**
       * Saves value for given key within localStorage
       * @param {String} key they key where to store the value in
       * @param {String|Number|Boolean|Object} value the value to store
       * @returns {*} the given value
       */
      setValue: function setValue(key, value) {
        if (key && typeof key === 'string' && value != null && window.localStorage) {
          window.localStorage.setItem(key, value != null && _typeof(value) === 'object' ? JSON.stringify(value) : value);
        }

        return value;
      },

      /**
       * Gets value from given key within localStorage
       * @param {String} key the key to retrieve value from
       * @param {*} [defaultValue] optional default value if key does not exists or value isn't set
       * @returns {String|Number|Boolean|Object} the value
       */
      getValue: function getValue(key, defaultValue) {
        var value = '';

        if (key && typeof key === 'string' && window.localStorage) {
          value = window.localStorage.getItem(key); // try to detect JSON object or array to return parsed value

          if (typeof value === 'string' && (value.substr(0, 2) === '{"' || value.substr(0, 2) === '[{')) {
            try {
              return JSON.parse(value);
            } catch (error) {}
          }

          if (value) return !isNaN(parseFloat(value)) && isFinite(value) ? parseFloat(value) : value === 'true' ? true : value === 'false' ? false : value;
          if (defaultValue) return defaultValue;
          return '';
        }

        return value;
      },

      /**
       * Clears the key and its stored value from localStorage
       * @param {String} key the key to clear and remove its value
       * @returns {String} empty string
       */
      removeValue: function removeValue(key) {
        if (key && typeof key === 'string' && window.localStorage) window.localStorage.removeItem(key);
        return '';
      }
    };

    /* script */
                const __vue_script__ = script;
                
    /* template */

      /* style */
      const __vue_inject_styles__$1 = undefined;
      /* scoped */
      const __vue_scope_id__$1 = undefined;
      /* module identifier */
      const __vue_module_identifier__$1 = undefined;
      /* functional template */
      const __vue_is_functional_template__$1 = undefined;
      /* component normalizer */
      function __vue_normalize__$1(
        template, style, script$$1,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/modules/storage.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var storage = __vue_normalize__$1(
        {},
        __vue_inject_styles__$1,
        __vue_script__,
        __vue_scope_id__$1,
        __vue_is_functional_template__$1,
        __vue_module_identifier__$1,
        undefined,
        undefined
      );

    var de = {
      LOGIN: 'Anmelden',
      MAIL: 'Mail-Adresse',
      PASSWORD: 'Passwort',
      COPYRIGHT_NOTE: '2018 EVWebtify - Web-Oberfläche von EVNotify',
      DASHBOARD: 'Dashboard',
      DEVICES: 'Geräte',
      EV_STATIONS: 'Stromtankstellen',
      LOGS: 'Fahrten-/Ladelogs',
      STATISTICS: 'Statistiken'
    };

    var en = {
      LOGIN: 'Login',
      MAIL: 'Mail address',
      PASSWORD: 'Password',
      COPYRIGHT_NOTE: '&copy; 2018 EVWebtify - Web-Interface of EVNotify',
      DASHBOARD: 'Dashboard',
      DEVICES: 'Devices',
      EV_STATIONS: 'Charging stations',
      LOGS: 'Drive-/Charging-Logs',
      STATISTICS: 'Statistics'
    };

    //
    var script$1 = {
      /**
       * Gets the current set local language or gets the default user preferred browser language
       * @returns {String} the local lng (either 'de' or 'en')
       */
      getLocalLng: function getLocalLng() {
        var lng = storage.getValue('lng', navigator.language || navigator.userLanguage);
        if (typeof lng === 'string' && lng.toLowerCase().indexOf('de') !== -1) return 'de';
        return 'en';
      },

      /**
       * Translates given key into it's local translation (either from set language or user preferred language)
       * @returns {String} the translated string
       */
      translate: function translate(key) {
        if (typeof key !== 'string') return '';
        if (this.getLocalLng() === 'de') return de[key] || key;
        return en[key] || key;
      },

      /**
       * Translates each key from language and returns translated object
       */
      translatePage: function translatePage() {
        var _this = this;

        var translated = {};
        Object.keys(de).forEach(function (key) {
          return translated[key] = _this.translate(key);
        });
        return translated;
      }
    };

    /* script */
                const __vue_script__$1 = script$1;
                
    /* template */

      /* style */
      const __vue_inject_styles__$2 = undefined;
      /* scoped */
      const __vue_scope_id__$2 = undefined;
      /* module identifier */
      const __vue_module_identifier__$2 = undefined;
      /* functional template */
      const __vue_is_functional_template__$2 = undefined;
      /* component normalizer */
      function __vue_normalize__$2(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/modules/translation.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var translation = __vue_normalize__$2(
        {},
        __vue_inject_styles__$2,
        __vue_script__$1,
        __vue_scope_id__$2,
        __vue_is_functional_template__$2,
        __vue_module_identifier__$2,
        undefined,
        undefined
      );

    //
    var EventBus = new Vue();

    /* script */
                const __vue_script__$2 = EventBus;
                
    /* template */

      /* style */
      const __vue_inject_styles__$3 = undefined;
      /* scoped */
      const __vue_scope_id__$3 = undefined;
      /* module identifier */
      const __vue_module_identifier__$3 = undefined;
      /* functional template */
      const __vue_is_functional_template__$3 = undefined;
      /* component normalizer */
      function __vue_normalize__$3(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/modules/event.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var EventBus$1 = __vue_normalize__$3(
        {},
        __vue_inject_styles__$3,
        __vue_script__$2,
        __vue_scope_id__$3,
        __vue_is_functional_template__$3,
        __vue_module_identifier__$3,
        undefined,
        undefined
      );

    var script$2 = {
      /**
       * Sends HTTP request for given HTTP method for specific function with given parameters
       * @param {String} method the HTTP method to use for this request
       * @param {String} fnc the function to call on the backend
       * @param {Object} params the params to send
       * @param {Function} callback callback function
       */
      sendRequest: function sendRequest(method, fnc, params, callback) {
        var allowedMethods = ['get', 'post', 'put', 'delete'];
        method = typeof method === 'string' ? method.toLowerCase() : '';

        if (allowedMethods.includes(method)) {
          if (typeof fnc !== 'string') fnc = '';
          if (params == null || _typeof(params) !== 'object') params = {}; // ensure that it is a valid object

          if (method === 'get') {
            params = {
              params: params
            }; // special handling for GET requests
          }

          Vue.http[method](RESTURL + fnc, params).then(function (response) {
            if (typeof callback === 'function') callback(null, response.body || response);
          }, function (err) {
            // global events for critical errors
            if (err && err.status === 401) EventBus$1.$emit('unauthorized');else if (err && err.status === 500) EventBus$1.$emit('internalerror');
            if (typeof callback === 'function') callback(err);
          });
        } else if (typeof callback === 'function') callback(405);
      }
    };

    /* script */
                const __vue_script__$3 = script$2;
                
    /* template */

      /* style */
      const __vue_inject_styles__$4 = undefined;
      /* scoped */
      const __vue_scope_id__$4 = undefined;
      /* module identifier */
      const __vue_module_identifier__$4 = undefined;
      /* functional template */
      const __vue_is_functional_template__$4 = undefined;
      /* component normalizer */
      function __vue_normalize__$4(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/modules/http.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      __vue_normalize__$4(
        {},
        __vue_inject_styles__$4,
        __vue_script__$3,
        __vue_scope_id__$4,
        __vue_is_functional_template__$4,
        __vue_module_identifier__$4,
        undefined,
        undefined
      );

    //
    var script$3 = {
      data: function data() {
        return {
          translated: {},
          loginForm: {
            mail: '',
            password: ''
          }
        };
      },
      methods: {
        login: function login() {// TODO send login request
        }
      },
      created: function created() {
        this.translated = translation.translatePage();
      }
    };

    /* script */
                const __vue_script__$4 = script$3;
                
    /* template */
    var __vue_render__$1 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "v-app",
        { attrs: { id: "inspire", dark: "" } },
        [
          _c(
            "v-content",
            [
              _c(
                "v-container",
                { attrs: { fluid: "", "fill-height": "" } },
                [
                  _c(
                    "v-layout",
                    { attrs: { "align-center": "", "justify-center": "" } },
                    [
                      _c(
                        "v-flex",
                        { attrs: { xs12: "", sm8: "", md4: "" } },
                        [
                          _c(
                            "v-card",
                            { staticClass: "elevation-12" },
                            [
                              _c(
                                "v-toolbar",
                                [
                                  _c("v-toolbar-title", [
                                    _vm._v(_vm._s(_vm.translated.LOGIN))
                                  ]),
                                  _vm._v(" "),
                                  _c("v-spacer")
                                ],
                                1
                              ),
                              _vm._v(" "),
                              _c(
                                "v-card-text",
                                [
                                  _c(
                                    "v-form",
                                    [
                                      _c("v-text-field", {
                                        attrs: {
                                          "prepend-icon": "person",
                                          label: _vm.translated.MAIL,
                                          type: "text"
                                        },
                                        model: {
                                          value: _vm.loginForm.mail,
                                          callback: function($$v) {
                                            _vm.$set(_vm.loginForm, "mail", $$v);
                                          },
                                          expression: "loginForm.mail"
                                        }
                                      }),
                                      _vm._v(" "),
                                      _c("v-text-field", {
                                        attrs: {
                                          "prepend-icon": "lock",
                                          label: _vm.translated.PASSWORD,
                                          type: "password"
                                        },
                                        model: {
                                          value: _vm.loginForm.password,
                                          callback: function($$v) {
                                            _vm.$set(_vm.loginForm, "password", $$v);
                                          },
                                          expression: "loginForm.password"
                                        }
                                      })
                                    ],
                                    1
                                  )
                                ],
                                1
                              ),
                              _vm._v(" "),
                              _c(
                                "v-card-actions",
                                [
                                  _c("v-spacer"),
                                  _vm._v(" "),
                                  _c("v-btn", { on: { click: _vm.login } }, [
                                    _vm._v(_vm._s(_vm.translated.LOGIN))
                                  ])
                                ],
                                1
                              )
                            ],
                            1
                          )
                        ],
                        1
                      )
                    ],
                    1
                  )
                ],
                1
              )
            ],
            1
          )
        ],
        1
      )
    };
    var __vue_staticRenderFns__$1 = [];
    __vue_render__$1._withStripped = true;

      /* style */
      const __vue_inject_styles__$5 = undefined;
      /* scoped */
      const __vue_scope_id__$5 = undefined;
      /* module identifier */
      const __vue_module_identifier__$5 = undefined;
      /* functional template */
      const __vue_is_functional_template__$5 = false;
      /* component normalizer */
      function __vue_normalize__$5(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/pages/login-page.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var LoginPage = __vue_normalize__$5(
        { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
        __vue_inject_styles__$5,
        __vue_script__$4,
        __vue_scope_id__$5,
        __vue_is_functional_template__$5,
        __vue_module_identifier__$5,
        undefined,
        undefined
      );

    //
    var script$4 = {
      data: function data() {
        return {
          drawer: false,
          mail: storage.getValue('mail'),
          avatarURL: 'https://robohash.org/' + this.mail,
          translated: {}
        };
      },
      methods: {
        test: function test() {
          console.log('click');
        }
      },
      created: function created() {
        this.translated = translation.translatePage();
      }
    };

    /* script */
                const __vue_script__$5 = script$4;
                
    /* template */
    var __vue_render__$2 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "div",
        [
          _c(
            "v-navigation-drawer",
            {
              attrs: { clipped: "", fixed: "", app: "" },
              model: {
                value: _vm.drawer,
                callback: function($$v) {
                  _vm.drawer = $$v;
                },
                expression: "drawer"
              }
            },
            [
              _c(
                "v-toolbar",
                { staticClass: "transparent", attrs: { flat: "" } },
                [
                  _c(
                    "v-list",
                    { staticClass: "pa-0" },
                    [
                      _c(
                        "v-list-tile",
                        { attrs: { avatar: "" } },
                        [
                          _c("v-list-tile-avatar", [
                            _c("img", { attrs: { src: _vm.avatarURL } })
                          ]),
                          _vm._v(" "),
                          _c(
                            "v-list-tile-content",
                            [_c("v-list-tile-title", [_vm._v(_vm._s(_vm.mail))])],
                            1
                          )
                        ],
                        1
                      )
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _c(
                    "v-list-tile",
                    { on: { click: _vm.test } },
                    [
                      _c(
                        "v-list-tile-action",
                        [_c("v-icon", [_vm._v("settings")])],
                        1
                      )
                    ],
                    1
                  )
                ],
                1
              ),
              _vm._v(" "),
              _c(
                "v-list",
                { attrs: { dense: "" } },
                [
                  _c(
                    "v-list-tile",
                    { on: { click: _vm.test } },
                    [
                      _c(
                        "v-list-tile-action",
                        [_c("v-icon", [_vm._v("dashboard")])],
                        1
                      ),
                      _vm._v(" "),
                      _c(
                        "v-list-tile-content",
                        [
                          _c("v-list-tile-title", [
                            _vm._v(_vm._s(_vm.translated.DASHBOARD))
                          ])
                        ],
                        1
                      )
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _c(
                    "v-list-tile",
                    { on: { click: _vm.test } },
                    [
                      _c(
                        "v-list-tile-action",
                        [_c("v-icon", [_vm._v("devices")])],
                        1
                      ),
                      _vm._v(" "),
                      _c(
                        "v-list-tile-content",
                        [
                          _c("v-list-tile-title", [
                            _vm._v(_vm._s(_vm.translated.DEVICES))
                          ])
                        ],
                        1
                      )
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _c(
                    "v-list-tile",
                    { on: { click: _vm.test } },
                    [
                      _c(
                        "v-list-tile-action",
                        [_c("v-icon", [_vm._v("ev_station")])],
                        1
                      ),
                      _vm._v(" "),
                      _c(
                        "v-list-tile-content",
                        [
                          _c("v-list-tile-title", [
                            _vm._v(_vm._s(_vm.translated.EV_STATIONS))
                          ])
                        ],
                        1
                      )
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _c(
                    "v-list-tile",
                    { on: { click: _vm.test } },
                    [
                      _c(
                        "v-list-tile-action",
                        [_c("v-icon", [_vm._v("view_list")])],
                        1
                      ),
                      _vm._v(" "),
                      _c(
                        "v-list-tile-content",
                        [
                          _c("v-list-tile-title", [
                            _vm._v(_vm._s(_vm.translated.LOGS))
                          ])
                        ],
                        1
                      )
                    ],
                    1
                  ),
                  _vm._v(" "),
                  _c(
                    "v-list-tile",
                    { on: { click: _vm.test } },
                    [
                      _c(
                        "v-list-tile-action",
                        [_c("v-icon", [_vm._v("show_chart")])],
                        1
                      ),
                      _vm._v(" "),
                      _c(
                        "v-list-tile-content",
                        [
                          _c("v-list-tile-title", [
                            _vm._v(_vm._s(_vm.translated.STATISTICS))
                          ])
                        ],
                        1
                      )
                    ],
                    1
                  )
                ],
                1
              )
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "v-toolbar",
            { attrs: { app: "", fixed: "", "clipped-left": "" } },
            [
              _c("v-toolbar-side-icon", {
                on: {
                  click: function($event) {
                    $event.stopPropagation();
                    _vm.drawer = !_vm.drawer;
                  }
                }
              }),
              _vm._v(" "),
              _c("v-toolbar-title", [_vm._v("EVWebtify")])
            ],
            1
          )
        ],
        1
      )
    };
    var __vue_staticRenderFns__$2 = [];
    __vue_render__$2._withStripped = true;

      /* style */
      const __vue_inject_styles__$6 = undefined;
      /* scoped */
      const __vue_scope_id__$6 = undefined;
      /* module identifier */
      const __vue_module_identifier__$6 = undefined;
      /* functional template */
      const __vue_is_functional_template__$6 = false;
      /* component normalizer */
      function __vue_normalize__$6(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/container/drawer.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var pageDrawer = __vue_normalize__$6(
        { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
        __vue_inject_styles__$6,
        __vue_script__$5,
        __vue_scope_id__$6,
        __vue_is_functional_template__$6,
        __vue_module_identifier__$6,
        undefined,
        undefined
      );

    //
    var script$5 = {
      data: function data() {
        return {
          translated: {}
        };
      },
      created: function created() {
        this.translated = translation.translatePage();
      }
    };

    /* script */
                const __vue_script__$6 = script$5;
                
    /* template */
    var __vue_render__$3 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("v-footer", { attrs: { app: "", fixed: "" } }, [
        _c("span", [_vm._v("©" + _vm._s(_vm.translated.COPYRIGHT_NOTE))])
      ])
    };
    var __vue_staticRenderFns__$3 = [];
    __vue_render__$3._withStripped = true;

      /* style */
      const __vue_inject_styles__$7 = undefined;
      /* scoped */
      const __vue_scope_id__$7 = undefined;
      /* module identifier */
      const __vue_module_identifier__$7 = undefined;
      /* functional template */
      const __vue_is_functional_template__$7 = false;
      /* component normalizer */
      function __vue_normalize__$7(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/container/footer.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var pageFooter = __vue_normalize__$7(
        { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
        __vue_inject_styles__$7,
        __vue_script__$6,
        __vue_scope_id__$7,
        __vue_is_functional_template__$7,
        __vue_module_identifier__$7,
        undefined,
        undefined
      );

    //
    var script$6 = {
      components: {
        pageDrawer: pageDrawer,
        pageFooter: pageFooter
      }
    };

    /* script */
                const __vue_script__$7 = script$6;
                
    /* template */
    var __vue_render__$4 = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c(
        "v-app",
        { attrs: { id: "inspire", dark: "" } },
        [
          _c("page-drawer"),
          _vm._v(" "),
          _c(
            "v-content",
            [
              _c(
                "v-container",
                { attrs: { fluid: "", "fill-height": "" } },
                [
                  _c("v-layout", {
                    attrs: { "justify-center": "", "align-center": "" }
                  })
                ],
                1
              )
            ],
            1
          ),
          _vm._v(" "),
          _c("page-footer")
        ],
        1
      )
    };
    var __vue_staticRenderFns__$4 = [];
    __vue_render__$4._withStripped = true;

      /* style */
      const __vue_inject_styles__$8 = undefined;
      /* scoped */
      const __vue_scope_id__$8 = undefined;
      /* module identifier */
      const __vue_module_identifier__$8 = undefined;
      /* functional template */
      const __vue_is_functional_template__$8 = false;
      /* component normalizer */
      function __vue_normalize__$8(
        template, style, script,
        scope, functional, moduleIdentifier,
        createInjector, createInjectorSSR
      ) {
        const component = (typeof script === 'function' ? script.options : script) || {};

        // For security concerns, we use only base name in production mode.
        component.__file = "/home/gcorso/Developing/EVWebtify/app/www/components/pages/dashboard-page.vue";

        if (!component.render) {
          component.render = template.render;
          component.staticRenderFns = template.staticRenderFns;
          component._compiled = true;

          if (functional) component.functional = true;
        }

        component._scopeId = scope;

        return component
      }
      /* style inject */
      
      /* style inject SSR */
      

      
      var DashboardPage = __vue_normalize__$8(
        { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
        __vue_inject_styles__$8,
        __vue_script__$7,
        __vue_scope_id__$8,
        __vue_is_functional_template__$8,
        __vue_module_identifier__$8,
        undefined,
        undefined
      );

    Vue.use(plugin);
    Vue.use(VueRouter); // for session support

    Vue.http.options.credentials = true;
    var router = new VueRouter({
      routes: [{
        path: '/',
        component: LoginPage
      }, {
        path: '/dashboard',
        component: DashboardPage
      }]
    }); // the vue instance

    var vm = new Vue({
      el: '#app',
      data: function data() {
        return {
          deviceReady: false
        };
      },
      components: {
        'app': App,
        'login-page': LoginPage,
        'dashboard-page': DashboardPage
      },
      router: router,
      render: function render(h) {
        return h(App);
      }
    }); // apply event listener for deviceready

    document.addEventListener('deviceready', function () {
      return vm.deviceReady = true;
    });

}());
