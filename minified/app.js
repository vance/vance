angular.module('FScapeApp.Controllers', ['FScapeApp.Modals']);
angular.module('FScapeApp.Modals', [
  'ngRoute',
  'ngResource',
  'appSettings'
]);
angular.module('FScapeApp.Models', [
  'ngRoute',
  'ngResource',
  'appSettings'
]);
angular.module('FScapeApp.Services', [
  'ngRoute',
  'ngResource',
  'appSettings'
]);
angular.module('FScapeApp.Directives', [
  'ngRoute',
  'ngResource',
  'appSettings'
]);
angular.module('FScapeApp.Filters', [
  'ngRoute',
  'ngResource',
  'appSettings'
]);
angular.module('FScapeApp.Providers', [
  'ngRoute',
  'ngResource',
  'appSettings'
]);
var app = angular.module('FScapeApp', [
    'ngTouch',
    'ngCookies',
    'FScapeApp.Modals',
    'FScapeApp.Models',
    'FScapeApp.Controllers',
    'FScapeApp.Services',
    'FScapeApp.Directives',
    'FScapeApp.Filters',
    'FScapeApp.Providers'
  ]);
app.config([
  '$routeProvider',
  function ($routeProvider) {
    'use strict';
    $routeProvider.when('/test', { templateUrl: 'main/app/pages/testbed/testbed.tpl.html' });
  }
]);
app.run([
  '$rootScope',
  '$route',
  '$location',
  function ($rootScope, $route, $location) {
    'use strict';
    // bind the '$locationChangeSuccess' event on the rootScope
    $rootScope.$on('$routeChangeStart', function () {
    });
    // bind the '$locationChangeSuccess' event on the rootScope
    $rootScope.$on('$locationChangeSuccess', function () {
    });
  }
]);var settingsModule = angular.module('appSettings', []);
settingsModule.factory('settings', function () {
  'use strict';
  return {
    baseURL: function () {
      var pathArray = window.location.href.split('/');
      var protocol = pathArray[0];
      var host = pathArray[2];
      var url = protocol + '//' + host;
      return url;
    },
    isLocalDev: function () {
      var regexTestIfDev = new RegExp('fscape');
      return regexTestIfDev.test(this.baseURL());
    },
    serviceConfig: {
      endpoints: {
        config: {
          absoluteUrl: 'http://services.foreverscape.com/',
          version: 'v1'
        },
        tile: {
          absoluteUrl: 'http://services.foreverscape.com/',
          version: 'v1'
        }
      }
    }
  };
});