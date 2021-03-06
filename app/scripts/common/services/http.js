define([
        'underscore'
    ], function(
        _
    ) {
'use strict';
return function() {
    var self = this;
    var providerRequestInterceptors = self.requestInterceptors = [];
    self.httpDecorator = [
                '$delegate', '$q', '$rootScope', '$timeout', '$injector',
        function($delegate,   $q,   $rootScope,   $timeout,   $injector) {

        var requestInterceptors = [];

        _(providerRequestInterceptors).each(function(interceptor) {
            requestInterceptors.push(
                _.isString(interceptor) ? $injector.get(interceptor) : $injector.invoke(interceptor)
            );
        });

        function http(config) {
            function failRequestInterceptor(requestInterceptor) {
                return requestInterceptor(config) === false;
            }

            if (_(requestInterceptors).any(failRequestInterceptor)) {
                var deferred = $q.defer();
                var promise = deferred.promise;
                // This promise will never success...
                promise.success = function() {
                    return promise;
                };
                promise.error = function(fn) {
                    promise.then(null, function(reason) {
                        // Same as $http: data, status, headers, config
                        fn(reason, -1, [], config);
                    });
                    return promise;
                };
                // Keep same as $http, always asyncly.
                $timeout(function() {
                    deferred.reject('requestInterceptor failed.');
                }, 0);
                return promise;
            }
            else {
                return $delegate(config);
            }
        }

        _(['get', 'delete', 'head', 'jsonp']).each(function(name) {
            http[name] = function(url, config) {
                return http(_.extend(config || {}, {
                    method: name,
                    url: url
                }));
            };
        });

        _(['post', 'put']).each(function(name) {
            http[name] = function(url, data, config) {
                return http(_.extend(config || {}, {
                    method: name,
                    url: url,
                    data: data
                }));
            };
        });

        return http;
    }];
    self.$get = function() {};
};
});
