(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('AuthTest', [
    '$resource',
    function ($resource) {
      var Widget = {};
      return Widget;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').service('BaseController', [
    '$routeParams',
    '$location',
    function ($routeParams, $location) {
      return function (scope) {
        return {
          scope: null,
          urlParams: null,
          rootRoute: null,
          instanceNumber: null,
          init: function () {
            this.scope = scope;
            this.defineListeners();
            this.instanceNumber = Math.round(Math.random() * 10000) + 1;
            this.urlParams = this.getMap($routeParams.wildcard);
            this.route = $location.path().split('/')[1];
            if (this.onInit) {
              this.onInit();
            }
          },
          defineListeners: function () {
            var that = this;
            this.scope.$on('$destroy', function () {
              that.destroy();
            });
            if (this.onDefineListeners) {
              this.onDefineListeners();
            }
          },
          removeListeners: function () {
            if (this.onRemoveListeners) {
              this.onRemoveListeners();
            }
          },
          destroy: function () {
            this.removeListeners();
            if (this.onDestroy) {
              this.onDestroy();
            }
          },
          getMap: function (strValue) {
            var map = {};
            if (strValue === undefined) {
              return map;
            }
            var arr = ['padding'];
            arr = arr.concat(strValue.split('/'));
            for (var i = 0; i < arr.length; i++) {
              if (i % 2 === 0 && i !== 0) {
                map[arr[i - 1]] = arr[i];
              }
            }
            return map;
          },
          buildPath: function (map) {
            var arr = [];
            var path;
            for (var property in map) {
              if (map.hasOwnProperty(property)) {
                arr.push(property);
                arr.push(map[property]);
              }
            }
            path = arr.join('/');
            return path;
          }
        };
      };
    }
  ]);
}());(function () {
  'use strict';
  // Abstract resource
  angular.module('FScapeApp.Services').factory('BaseHttpService', [
    '$http',
    'settings',
    function ($http, settings) {
      return function () {
        return {
          buildResourcePath: function (sp) {
            var path = sp;
            var finalUrl = '';
            if (sp === undefined) {
              path = this.servicePath;
            }
            var endpoint = settings.serviceConfig.endpoints[path];
            if (endpoint === undefined || endpoint === null) {
              throw new Error('\n\n > WARNING! Please add a node in the settings file for your endpoint(' + path + '). < \n \n');
            }
            if (endpoint.version !== '') {
              finalUrl = this.addSlash(endpoint.absoluteUrl) + endpoint.version;
            } else {
              finalUrl = endpoint.absoluteUrl;
            }
            return this.addSlash(finalUrl);
          },
          getAll: function () {
            var url = this.buildResourcePath();
            return $http({
              url: url,
              method: 'GET',
              data: {},
              params: {}
            });
          },
          getBy: function (key, value) {
            var url = this.buildResourcePath() + key + '/' + value;
            return $http({
              url: url,
              method: 'GET',
              data: {},
              params: {}
            });
          },
          add: function (data) {
            var url = this.buildResourcePath();
            return $http({
              url: url,
              method: 'POST',
              data: data,
              params: {}
            });
          },
          update: function (data) {
            var id = '';
            if (data.id !== undefined && data.id !== null) {
              id = data.id;
            }
            var url = this.buildResourcePath();
            return $http({
              url: url,
              method: 'PUT',
              data: data,
              params: {}
            });
          },
          raiseTestHttpError: function () {
            var url = 'jiggy';
            return $http({
              url: 'http://localhost:8282/jiggy',
              method: 'DELETE',
              data: { nothing: 'to see here' },
              params: {}
            });
          },
          addSlash: function (str) {
            if (str.charAt(str.length - 1) !== '/') {
              str = str + '/';
            }
            return str;
          }
        };
      };
    }
  ]);
}());// Abstract model
angular.module('FScapeApp.Models').factory('BaseModel', function () {
  // note the data property on model!
  var Model = function (defaults, service) {
    this.data = defaults;
    this.service = service;
  };
  Model.prototype.setDataById = function (id, data) {
    var self = this;
    for (var i = 0; i < self.data.length; i++) {
      if (self.data[i].id === id) {
        for (var prop in data) {
          self.data[i][prop] = data[prop];
        }
      }
    }
  };
  Model.prototype.getById = function (id) {
    var self = this;
    return this.service.getBy('id', id).then(function (result) {
      self.data = result.data;
    });
  };
  Model.prototype.getAll = function () {
    var self = this;
    return this.service.getAll().then(function (result) {
      self.data = result.data;
    });
  };
  Model.prototype.getBy = function (key, value) {
    var self = this;
    return this.service.getBy(key, value).then(function (result) {
      self.data = result.data;
    });
  };
  Model.prototype.add = function (value) {
    var self = this;
    return this.service.add(value).then(function (result) {
      value.id = result.data.id;
      self.data.push(value);
    });
  };
  return Model;
});(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').controller('GlobalController', [
    '$scope',
    'settings',
    'BaseController',
    '$rootScope',
    'ErrorModal',
    'SuccessModal',
    'globalModelService',
    function ($scope, settings, BaseController, $rootScope, ErrorModal, SuccessModal, globalModelService) {
      var c = {
          onInit: function () {
            this.$scope = $scope;
            app.$globalScope = this.$scope;
            app.settings = settings;
            globalModelService.setSuccessCallback(this.showSuccess);
            $rootScope.$on('serverError', this.showError.bind(this));
          },
          showSuccess: function (data) {
            SuccessModal.activate();
          },
          showError: function (data) {
            ErrorModal.activate();
          }
        };
      angular.extend(c, new BaseController($scope));
      c.init();
      return c;
    }
  ]);
}());(function () {
  'use strict';
  var traceVal = [];
  var trace = function (val) {
    traceVal.push('<br/>' + val);
    $('#trace').html(traceVal.join(''));
    if (traceVal.length > 10) {
      traceVal.shift();
    }
  };
  angular.module('FScapeApp.Controllers').controller('foreverScapeEngineController', [
    '$scope',
    'BaseController',
    '$location',
    'configModel',
    'tileModel',
    'gridModel',
    '$rootScope',
    'fscapeService',
    function ($scope, BaseController, $location, configModel, tileModel, gridModel, $rootScope, fscapeService) {
      var controller = {
          _hasGrid: false,
          _allowTouch: true,
          zoom: 0.36,
          zoomMax: 1.6,
          zoomMin: 0.5,
          offsetX: 0,
          offsetY: -350,
          time: 0,
          canIntro: true,
          mouseDownX: null,
          mouseDownY: null,
          mouseX: null,
          mouseY: null,
          mousePreviousX: 0,
          mousePreviousY: 0,
          dx: 0,
          dy: 0,
          startDragTime: new Date(),
          endDragTime: new Date(),
          _mouseDown: false,
          _dragging: false,
          _flickingX: false,
          _flickingY: false,
          _scaling: false,
          flickTweenX: null,
          flickTweenY: null,
          zoomTween: null,
          prevPinchDist: 0,
          offscreenLeft: -1004,
          offscreenRight: 200000,
          offscreenTop: -10000,
          offscreenBottom: 20000,
          hide: false,
          location: $location,
          imageTiles: [],
          gridBoxes: [],
          config: null,
          endCoords: {},
          startCoords: {},
          is_touch_device: false,
          onInit: function () {
            var that = this;
            $scope.trace = '';
            this.buildGrid();
            this.setupTouchEvents();
            $rootScope.$on('fscape.togglePlayback', function () {
            });
            setTimeout(function () {
              if (that.canIntro) {
                that.offsetX -= 900;
                ;
                TweenMax.to($('.engine-position'), 3, {
                  css: {
                    left: that.offsetX,
                    top: that.offsetY
                  }
                });
              }
            }, 2500);
            $('.preload-junk').html('');
          },
          setupTouchEvents: function () {
            var that = this;
            that.is_touch_device = 'ontouchstart' in document.documentElement || 'ontouchstart' in window;
            $(document).bind('gesturestart', function (e) {
              e.originalEvent.preventDefault();
            }, false);
            $(document).bind('gestureend', function (e) {
              e.originalEvent.preventDefault();
            }, false);
            $(document).bind('touchstart', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
              if (event.originalEvent.touches.length === 2 || event.originalEvent.targetTouches.length === 2) {
                that._scaling = true;
                that.pinchStart(event);
                return;
              }
              if (!that._allowTouch) {
                return;
              }
              that._allowTouch = false;
              that.mouseDownX = event.originalEvent.targetTouches[0].pageX || event.originalEvent.changedTouches[0].pageX || event.originalEvent.touches[0].pageX;
              that.mouseDownY = event.originalEvent.targetTouches[0].pageY || event.originalEvent.changedTouches[0].pageY || event.originalEvent.touches[0].pageY;
              that.mouseX = event.originalEvent.targetTouches[0].pageX || event.originalEvent.changedTouches[0].pageX || event.originalEvent.touches[0].pageX;
              that.mouseY = event.originalEvent.targetTouches[0].pageY || event.originalEvent.changedTouches[0].pageY || event.originalEvent.touches[0].pageY;
              that.down();
            });
            $(document).bind('touchmove', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
              if (that._scaling) {
                that.pinchMove(event);
                return;
              }
              that.mouseX = event.originalEvent.targetTouches[0].pageX || event.originalEvent.changedTouches[0].pageX || event.originalEvent.touches[0].pageX;
              that.mouseY = event.originalEvent.targetTouches[0].pageY || event.originalEvent.changedTouches[0].pageY || event.originalEvent.touches[0].pageY;
              that.move();
            });
            $(document).bind('touchend', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
              window.clearTimeout(that.touchTimeout);
              that.touchTimeout = window.setTimeout(function () {
                that._allowTouch = true;
              }, 300);
              if (that._scaling) {
                that.pinchEnd(event);
                that._scaling = false;
                return;
              }
              that.up();
            });
            $(document).bind('touchcancel', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
            });
            configModel.getConfig().then(function () {
              trace('gotConfig');
              that.config = configModel.data;
              that.gridBoxes = gridModel.gridBoxes;
              tileModel.getTiles().then(function (result) {
                that.imageTiles = result;
                trace('got tiles');
                that.setZoomTarget();
              });
            });
            $(document).mousewheel(function (e) {
              e.originalEvent.preventDefault();
              if (e.deltaY > 0) {
                that.zoomIn();
              } else {
                that.zoomOut();
              }
            });
          },
          pinchStart: function (e) {
            this.startDistance = this.getPinchDistance(e);
          },
          pinchMove: function (e) {
            var dist = this.getPinchDistance(e);
            if (dist - this.prevPinchDist > 0) {
              this.zoomIn();
              this.setZoomTarget();
            } else {
              this.zoomOut();
            }
            this.prevPinchDist = dist;
          },
          pinchEnd: function (e) {
            trace('pinchEnd');
          },
          getPinchDistance: function (e) {
            var dist = 0;
            if (e.originalEvent.touches[0]) {
              dist = Math.sqrt((e.originalEvent.touches[0].pageX - e.originalEvent.touches[1].pageX) * (e.originalEvent.touches[0].pageX - e.originalEvent.touches[1].pageX) + (e.originalEvent.touches[0].pageY - e.originalEvent.touches[1].pageY) * (e.originalEvent.touches[0].pageY - e.originalEvent.touches[1].pageY));
            } else if (e.originalEvent.changedTouches[0]) {
              dist = Math.sqrt((e.originalEvent.changedTouches[0].pageX - e.originalEvent.changedTouches[1].pageX) * (e.originalEvent.changedTouches[0].pageX - e.originalEvent.changedTouches[1].pageX) + (e.originalEvent.changedTouches[0].pageY - e.originalEvent.changedTouches[1].pageY) * (e.originalEvent.changedTouches[0].pageY - e.originalEvent.changedTouches[1].pageY));
            }
            return dist;
          },
          mouseDown: function ($event) {
            $event.preventDefault();
            if (this.is_touch_device)
              return;
            trace('mouseDown');
            this.mouseDownX = $event.pageX;
            this.mouseDownY = $event.pageY;
            this.mouseX = $event.pageX;
            this.mouseY = $event.pageY;
            this.down();
          },
          down: function () {
            this.canIntro = false;
            this.startDragTime = new Date();
            this.mousePreviousX = this.mouseX;
            this.mousePreviousY = this.mouseY;
            this._mouseDown = true;
            this._flickingX = false;
            this._flickingY = false;
            this.dx = 0;
            this.dy = 0;
            if (this.flickTweenX) {
              this.offsetX = parseInt($('.engine-position').css('left'), 10);
              this.flickTweenX.kill();
            }
            if (this.flickTweenY) {
              this.offsetY = parseInt($('.engine-position').css('top'), 10);
              this.flickTweenY.kill();
            }
          },
          mouseMove: function ($event) {
            $event.preventDefault();
            if (this.is_touch_device)
              return;
            this.mouseX = $event.pageX;
            this.mouseY = $event.pageY;
            this.move();
          },
          move: function () {
            this.endDragTime = new Date();
            this.dx = this.mouseX - this.mousePreviousX;
            this.dy = this.mouseY - this.mousePreviousY;
            if (this._mouseDown && !this._flickingX) {
              this._dragging = true;
              this.offsetX += this.dx * (3 * (this.zoomMax + 0.1 - this.zoom));
              this.setCSSPosition();
            }
            if (this._mouseDown && !this._flickingY) {
              this._dragging = true;
              this.offsetY += this.dy * (3 * (this.zoomMax + 0.1 - this.zoom));
              this.setCSSPosition();
            }
            // todo: refactor so service keeps track of offset
            this.mousePreviousX = this.mouseX;
            this.mousePreviousY = this.mouseY;
          },
          setCSSPosition: function () {
            $('.engine-position').css({
              'left': this.offsetX,
              'top': this.offsetY
            });
          },
          mouseUp: function ($event) {
            $event.preventDefault();
            if (this.is_touch_device)
              return;
            trace('mouseUp');
            this.up();
          },
          up: function () {
            this.endDragTime = new Date();
            this._mouseDown = false;
            this._dragging = false;
            this.flick();
          },
          flick: function () {
            var that = this;
            var dTime = this.endDragTime - this.startDragTime;
            if (dTime === 0)
              return;
            var velX = this.dx / dTime;
            var velY = this.dy / dTime;
            //flick
            if (!this._flickingX && Math.abs(velX) > 0.15 || Math.abs(velY) > 0.15) {
              trace('flickX start');
              this._flickingX = true;
              this.offsetX += 3000 * velX;
              this.flickTweenX = TweenMax.to($('.engine-position'), 1, {
                css: { left: that.offsetX },
                onComplete: function () {
                  that._flickingX = false;
                  $scope.$apply();
                }
              });
            }
            if (!this._flickingY && Math.abs(velX) > 0.15 || Math.abs(velY) > 0.15) {
              trace('flickY start');
              this._flickingY = true;
              this.offsetY += 3000 * velY;
              this.flickTweenY = TweenMax.to($('.engine-position'), 1, {
                css: { top: that.offsetY },
                onComplete: function () {
                  that._flickingY = false;
                  $scope.$apply();
                }
              });
            }
          },
          zoomIn: function (multiplier) {
            if (!multiplier) {
              multiplier = 1;
            }
            if (this.zoom > this.zoomMax)
              return;
            this.zoom += 0.025 * multiplier;
            this.setZoomTarget();
          },
          zoomOut: function (multiplier) {
            if (!multiplier) {
              multiplier = 1;
            }
            if (this.zoom <= 0.26)
              return;
            this.zoom -= 0.025 * multiplier;
            this.setZoomTarget();
          },
          setZoomTarget: function (newZoom) {
            var that = this;
            if (newZoom) {
              that.zoom = newZoom;
            }
            if (this.zoomTween) {
              this.zoomTween.kill();
            }
            that.zoomTween = TweenMax.to($('.engine-scale'), 0, { css: { scale: that.zoom } });
          },
          buildGrid: function () {
            // this used to be generated in ng-repeate
            // we do this manually to improve performance
            if (!this.gridBoxes.length) {
              return;
            }
            for (var i = 0; i < this.gridBoxes.length; i++) {
              var gb = this.gridBoxes[i];
              var container = document.createElement('div');
              var domId = 'grid-' + i;
              container.setAttribute('id', domId);
              container.setAttribute('class', 'grid-box');
              container.setAttribute('style', 'left:' + gb.x + 'px;top:' + gb.y + 'px;');
              var full = document.createElement('img');
              full.setAttribute('class', 'full');
              full.setAttribute('id', 'full-' + domId);
              var thumb = document.createElement('img');
              thumb.setAttribute('class', 'thumb');
              thumb.setAttribute('id', 'thumb-' + domId);
              thumb.setAttribute('src', gb.currentTile.thumbUrl);
              jQuery(container).append(thumb);
              jQuery(container).append(full);
              jQuery('#tile-engine').append(container);
            }
            this._hasGrid = true;
          },
          render: function () {
            var that = this;
            that.time += 1;
            if (that.config === null)
              return;
            if (!this._hasGrid) {
              this.buildGrid();
              return;
            }
            if (fscapeService.isPlaying) {
              this.offsetX += 10;
              console.log(' scolling', this.offsetX);
            }
            var loadBoundaryOffsetX = this.config.tileWidth * 4 * this.zoom;
            this.offscreenLeft = 100 - loadBoundaryOffsetX;
            this.offscreenRight = 16 * this.config.tileWidth * this.zoom - loadBoundaryOffsetX;
            var loadBoundaryOffsetY = this.config.tileHeight * 4 * this.zoom;
            this.offscreenTop = 50 - loadBoundaryOffsetY;
            this.offscreenBottom = this.zoom * 11 * this.config.tileHeight - loadBoundaryOffsetY;
            for (var i = 0; i < this.gridBoxes.length; i++) {
              var gb = that.gridBoxes[i];
              if (!gb.element) {
                gb.element = $('#' + gb.domId);
                gb.thumbElement = $('#thumb-' + gb.domId);
                gb.fullElement = $('#full-' + gb.domId);
              }
              var offset = gb.element.offset();
              gb.screenX = parseInt(offset.left, 10);
              gb.screenY = parseInt(offset.top, 10);
              this.setIsOffscreen(gb);
              this.loadFullResTiles(gb);
            }
          },
          setIsOffscreen: function (gb) {
            var isOffscreenLeft = gb.screenX < this.offscreenLeft && this.dx < 0;
            var isOffscreenRight = gb.screenX >= this.offscreenRight && this.dx > 0;
            if (isOffscreenLeft) {
              gb.col += 15;
              gb.currentTileId += 30;
              gb.row += 3;
            } else if (isOffscreenRight) {
              gb.col -= 15;
              gb.currentTileId -= 30;
              gb.row -= 3;
            }
            var isOffscreenTop = gb.screenY < this.offscreenTop;
            var isOffscreenBottom = gb.screenY > this.offscreenBottom;
            // grid has moved above the top or bottom threshold, increment the image index
            if (isOffscreenTop && this.dy < 0) {
              gb.currentTileId += 50;
              gb.row += 10;
            } else if (isOffscreenBottom && this.dy > 0) {
              gb.currentTileId -= 50;
              gb.row -= 10;
            }
            // grid has moved left or right of the loading boundary, increment the image index
            if (isOffscreenLeft || isOffscreenRight || isOffscreenTop || isOffscreenBottom) {
              gb.x = gb.col * gb.width;
              gb.y = gb.row * gb.height;
              if (gb.currentTileId < 0) {
                gb.currentTileId = this.config.totalPages + gb.currentTileId;
              } else if (gb.currentTileId >= this.config.totalPages) {
                gb.currentTileId = gb.currentTileId - this.config.totalPages;
              }
              gb.currentTile = tileModel.tiles[gb.currentTileId];
              gb.element.css({ 'left': gb.x });
              gb.element.css({ 'top': gb.y });
              if (gb.currentTile) {
                if (gb.thumbElement.attr('src') != gb.currentTile.thumbUrl);
                {
                  gb.thumbElement.attr('src', gb.currentTile.thumbUrl);
                }
              }
            }
          },
          loadFullResTiles: function (gb) {
            // see if the image is in bounds of the screen and show the high resolution if zoomed in enough
            if (this.zoom > 0.36 && !this._dragging && !this._flickingX && !this._flickingY) {
              var isOnLeft = gb.screenX > -(this.config.tileWidth * this.zoom);
              var isOnRight = gb.screenX < window.innerWidth;
              var isOnTop = gb.screenY > -(this.config.tileHeight * this.zoom);
              var isOnBottom = gb.screenY < window.innerHeight + this.config.tileHeight * this.zoom;
              if (isOnLeft && isOnRight && isOnTop && isOnBottom && !gb.isOnScreen) {
                if (gb.currentTile && gb.fullElement.attr('src').toString() != gb.currentTile.fullUrl.toString());
                {
                  ;
                  gb.isOnScreen = true;
                  gb.fullElement.attr('src', gb.currentTile.fullUrl);
                }
              }
            } else {
              if (gb.currentTile) {
                gb.isOnScreen = false;
                gb.fullElement.attr('src', 'main/resources/img/blank.gif');
              }
            }
          }
        };
      (function animloop() {
        window.requestAnimFrame(animloop);
        controller.render();
      }());
      angular.extend(controller, new BaseController($scope));
      controller.init();
      return controller;
    }
  ]);
  //request animation frame
  window.requestAnimFrame = function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
      window.setTimeout(callback, 1000 / 30);
    };
  }();
  //polyfill for reqAnimationFrame though it prolly won't perform well at all on the system anyway
  (function () {
    var lastTime = 0;
    var vendors = [
        'webkit',
        'moz'
      ];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function (callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
            callback(currTime + timeToCall);
          }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
  }());
}());(function () {
  'use strict';
  angular.module('FScapeApp.Directives').directive('foreverscapeEngine', function () {
    return {
      restrict: 'E',
      replace: true,
      controller: 'foreverScapeEngineController',
      controllerAs: 'fscapeEngineCtrl',
      templateUrl: 'main/core/components/foreverscapeEngine/foreverscape-engine.tpl.html'
    };
  });
}());(function () {
  'use strict';
  angular.module('FScapeApp.Directives').directive('loadIndicator', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'main/core/components/loadIndicator/indicator.html',
      link: function ($scope, element, attrs) {
        $scope.$on('loaderShow', function () {
          return element.show();
        });
        return $scope.$on('loaderHide', function () {
          return element.hide();
        });
      }
    };
  });
}());(function () {
  'use strict';
  angular.module('FScapeApp.Directives').directive('locationTool', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'main/core/components/locationTool/location-tool.html'
    };
  });
}());(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').controller('locationTool', [
    '$scope',
    'BaseController',
    '$location',
    '$window',
    '$rootScope',
    'fscapeService',
    function ($scope, BaseController, $location, $window, $rootScope, fscapeService) {
      var c = {
          hide: false,
          location: $location,
          onInit: function () {
            $rootScope.fscape = {};
            $scope.fscapeService = fscapeService;
            $scope.win = $window;
            $scope.isPlaying = false;
            angular.element($window).bind('resize', this.onResize);
            angular.element($window).bind('orientationchange', this.onResize);
            this.onResize();
          },
          togglePlayback: function () {
            fscapeService.togglePlayback();
          },
          onResize: function () {
            if ($scope.windowWidth < 450 || $scope.windowHeight < 478) {
              // jQuery('.navigation').hide();
              //jQuery('.title').css('scale',.7);
              if ($scope.windowHeight < 478) {
              } else {
              }
            } else {
            }
          }
        };
      angular.extend(c, new BaseController($scope));
      c.init();
      return c;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').controller('navController', [
    '$scope',
    'BaseController',
    '$location',
    '$window',
    function ($scope, BaseController, $location, $window) {
      var c = {
          hide: false,
          location: $location,
          onInit: function () {
            $scope.win = $window;
            angular.element($window).bind('resize', this.onResize);
            angular.element($window).bind('orientationchange', this.onResize);
            this.onResize();
          },
          onResize: function () {
            $scope.windowWidth = $window.innerWidth;
            $scope.windowHeight = $window.innerHeight;
            // angular reacts too slow, so i'm doing this classic style
            // it does not always digest on window size change
            if ($scope.windowWidth < 450 || $scope.windowHeight < 478) {
              jQuery('.navigation').hide();
              jQuery('.title').css('scale', 0.7);
              if ($scope.windowHeight < 478) {
                TweenMax.to($('.header-container'), 1, { css: { height: '40px' } });
                TweenMax.to($('.title'), 1, {
                  css: {
                    scale: 0.5,
                    right: '-60px'
                  }
                });
                TweenMax.to($('.menu'), 1, {
                  css: {
                    top: '-4px',
                    scale: 0.7,
                    left: '1px'
                  }
                });
              } else {
                TweenMax.to($('.header-container'), 1, { css: { height: '50px' } });
                TweenMax.to($('.title'), 1, {
                  css: {
                    scale: 0.7,
                    right: '-40px'
                  }
                });
                TweenMax.to($('.menu'), 1, {
                  css: {
                    top: '0px',
                    scale: 1,
                    left: '1px'
                  }
                });
              }
            } else {
              jQuery('.navigation').show();
              TweenMax.to($('.menu'), 1, {
                css: {
                  top: '9px',
                  scale: 1,
                  left: '10px'
                }
              });
              TweenMax.to($('.header-container'), 1, { css: { height: '65px' } });
              TweenMax.to($('.title'), 1, {
                css: {
                  scale: 1,
                  right: '0px'
                }
              });
            }
          },
          navClass: function (linkName) {
          },
          hideNav: function () {
            this.hide = true;
          },
          goToSearch: function () {
            return this.location.path('/product-search');
          },
          goToError: function () {
            return this.location.path('/error');
          }
        };
      angular.extend(c, new BaseController($scope));
      c.init();
      return c;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Directives').directive('navigation', function () {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'main/core/components/nav/navigation.html'
    };
  });
}());app.directive('alertSuccess', [
  '$http',
  '$parse',
  function ($rootScope) {
    return {
      require: 'ngModel',
      link: function (scope, ele, attrs, ngModelController) {
      }
    };
  }
]);app.directive('ensureExpression', [
  '$http',
  '$parse',
  function ($http, $parse) {
    return {
      require: 'ngModel',
      link: function (scope, ele, attrs, ngModelController) {
        scope.$watch(attrs.ngModel, function (value) {
          var booleanResult = $parse(attrs.ensureExpression)(scope);
          ngModelController.$setValidity('expression', booleanResult);
        });
      }
    };
  }
]);
app.directive('someOtherFormValidation', [
  '$http',
  '$parse',
  function ($http, $parse) {
    return {
      require: 'ngModel',
      link: function (scope, ele, attrs, ngModelController) {
        scope.$watch(attrs.ngModel, function (value) {
        });
      }
    };
  }
]);app.directive('imageOnload', function (tileModel) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.bind('load', function () {
        var tileId = attrs.numericId;
        if (tileId) {
          tileModel.tiles[parseInt(tileId, 0)].isLoading = false;  // console.log("done loading " + tileId);
        }  //element.parent().attr('isLoaded', true);
      });
    }
  };
});app.filter('capitalize', function () {
  return function (input, scope) {
    if (input != null)
      input = input.toLowerCase();
    return input.substring(0, 1).toUpperCase() + input.substring(1);
  };
});(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('httpInterceptor', [
    '$q',
    '$rootScope',
    '$log',
    '$timeout',
    'settings',
    '$location',
    'ErrorService',
    'RedirectionService',
    function ($q, $rootScope, $log, $timeout, settings, $location, ErrorService, RedirectionService) {
      var numLoadings = 0;
      return {
        request: function (config) {
          if (config) {
            if (config.preventLoader !== true) {
              numLoadings++;
              $rootScope.$broadcast('loaderShow');
            }
          }
          return config || $q.when(config);
        },
        response: function (response) {
          if (--numLoadings <= 0) {
            // Hide loader
            numLoadings = 0;
            $rootScope.$broadcast('loaderHide');
          }
          return response || $q.when(response);
        },
        responseError: function (response) {
          if (!--numLoadings) {
            // Hide loader
            $rootScope.$broadcast('loaderHide');
          }
          if (response.status >= 400) {
            ErrorService.setErrorMessage(response);
            $rootScope.$broadcast('serverError');
          } else if (response.status >= 400 && response.status === 404) {
            ErrorService.errorMessage = 'Could not load a dependency: 404';
            $rootScope.$broadcast('serverError');
          }
          return $q.reject(response);
        }
      };
    }
  ]);
  angular.module('FScapeApp.Services').config([
    '$httpProvider',
    function ($httpProvider) {
      $httpProvider.interceptors.push('httpInterceptor');
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('RedirectionService', [
    '$location',
    '$cookies',
    function ($location, $cookies) {
      return {
        hasRedirect: function () {
          if ($cookies.loginRedirectUrl) {
            return true;
          }
          return false;
        },
        setRedirectUrl: function (url) {
          if (url !== null) {
            if (url.indexOf('login') <= 0 && url.indexOf('timeout') <= 0) {
              $cookies.loginRedirectUrl = url;
            }
          }
        },
        redirect: function () {
          var url = null;
          if ($cookies.loginRedirectUrl) {
            url = this.getRedirectUrl();
            this.setRedirectUrl(null);
          }
          if (url !== null) {
            $location.path(url);
          }
        },
        getRedirectUrl: function () {
          return $cookies.loginRedirectUrl;
        }
      };
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('fscapeService', [
    '$location',
    '$cookies',
    '$rootScope',
    function ($location, $cookies, $rootScope) {
      return {
        isPlaying: false,
        offsetX: 0,
        offsetY: 0,
        init: function () {
          this.isPlaying = false;
          this.offset = {};
        },
        togglePlayback: function () {
          this.isPlaying = !this.isPlaying;
          $rootScope.$broadcast('fscape.togglePlayback');
        }
      };
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Services').service('touchService', [
    '$rootScope',
    function ($rootScope) {
      var touchService = {
          mouseDownX: null,
          mouseDownY: null,
          mouseX: null,
          mouseY: null,
          mousePreviousX: 0,
          mousePreviousY: 0,
          dx: 0,
          dy: 0,
          startDragTime: new Date(),
          endDragTime: new Date(),
          _mouseDown: false,
          _dragging: false,
          _flickingX: false,
          _flickingY: false,
          _scaling: false,
          flickTweenX: null,
          flickTweenY: null,
          zoomTween: null,
          prevPinchDist: 0,
          setupTouchEvents: function () {
            var that = this;
            that.is_touch_device = 'ontouchstart' in document.documentElement || 'ontouchstart' in window;
            $(document).bind('gesturestart', function (e) {
              e.originalEvent.preventDefault();
            }, false);
            $(document).bind('gestureend', function (e) {
              e.originalEvent.preventDefault();
            }, false);
            $(document).bind('touchstart', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
              if (event.originalEvent.touches.length === 2 || event.originalEvent.targetTouches.length === 2) {
                that._scaling = true;
                that.pinchStart(event);
                return;
              }
              if (!that._allowTouch) {
                return;
              }
              that._allowTouch = false;
              that.mouseDownX = event.originalEvent.targetTouches[0].pageX || event.originalEvent.changedTouches[0].pageX || event.originalEvent.touches[0].pageX;
              that.mouseDownY = event.originalEvent.targetTouches[0].pageY || event.originalEvent.changedTouches[0].pageY || event.originalEvent.touches[0].pageY;
              that.mouseX = event.originalEvent.targetTouches[0].pageX || event.originalEvent.changedTouches[0].pageX || event.originalEvent.touches[0].pageX;
              that.mouseY = event.originalEvent.targetTouches[0].pageY || event.originalEvent.changedTouches[0].pageY || event.originalEvent.touches[0].pageY;
              that.down();
            });
            $(document).bind('touchmove', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
              if (that._scaling) {
                that.pinchMove(event);
                return;
              }
              that.mouseX = event.originalEvent.targetTouches[0].pageX || event.originalEvent.changedTouches[0].pageX || event.originalEvent.touches[0].pageX;
              that.mouseY = event.originalEvent.targetTouches[0].pageY || event.originalEvent.changedTouches[0].pageY || event.originalEvent.touches[0].pageY;
              that.move();
            });
            $(document).bind('touchend', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
              window.clearTimeout(that.touchTimeout);
              that.touchTimeout = window.setTimeout(function () {
                that._allowTouch = true;
              }, 300);
              if (that._scaling) {
                that.pinchEnd(event);
                that._scaling = false;
                return;
              }
              that.up();
            });
            $(document).bind('touchcancel', function (event) {
              event.preventDefault();
              event.originalEvent.preventDefault();
            });
            $(document).mousewheel(function (e) {
              e.originalEvent.preventDefault();
              if (e.deltaY > 0) {
                that.zoomIn();
              } else {
                that.zoomOut();
              }
            });
          },
          pinchStart: function (e) {
            this.startDistance = this.getPinchDistance(e);
          },
          pinchMove: function (e) {
            var dist = this.getPinchDistance(e);
            //var difference = this.startDistance - difference;
            if (dist - this.prevPinchDist > 0) {
              this.zoomIn();
              this.setZoomTarget();
            } else {
              this.zoomOut();
            }
            this.prevPinchDist = dist;
          },
          pinchEnd: function (e) {
            trace('pinchEnd');
          },
          getPinchDistance: function (e) {
            var dist = 0;
            if (e.originalEvent.touches[0]) {
              dist = Math.sqrt((e.originalEvent.touches[0].pageX - e.originalEvent.touches[1].pageX) * (e.originalEvent.touches[0].pageX - e.originalEvent.touches[1].pageX) + (e.originalEvent.touches[0].pageY - e.originalEvent.touches[1].pageY) * (e.originalEvent.touches[0].pageY - e.originalEvent.touches[1].pageY));
            } else if (e.originalEvent.changedTouches[0]) {
              dist = Math.sqrt((e.originalEvent.changedTouches[0].pageX - e.originalEvent.changedTouches[1].pageX) * (e.originalEvent.changedTouches[0].pageX - e.originalEvent.changedTouches[1].pageX) + (e.originalEvent.changedTouches[0].pageY - e.originalEvent.changedTouches[1].pageY) * (e.originalEvent.changedTouches[0].pageY - e.originalEvent.changedTouches[1].pageY));
            }
            return dist;
          },
          mouseDown: function ($event) {
            $event.preventDefault();
            if (this.is_touch_device)
              return;
            trace('mouseDown');
            this.mouseDownX = $event.pageX;
            this.mouseDownY = $event.pageY;
            this.mouseX = $event.pageX;
            this.mouseY = $event.pageY;
            $rootScope.$broadcast('mouseDown');
            this.down();
          },
          down: function () {
            this.canIntro = false;
            this.startDragTime = new Date();
            this.mousePreviousX = this.mouseX;
            this.mousePreviousY = this.mouseY;
            this._mouseDown = true;
            this._flickingX = false;
            this._flickingY = false;
            this.dx = 0;
            this.dy = 0;
            if (this.flickTweenX) {
              this.offsetX = parseInt($('.engine-position').css('left'), 10);
              this.flickTweenX.kill();
            }
            if (this.flickTweenY) {
              this.offsetY = parseInt($('.engine-position').css('top'), 10);
              this.flickTweenY.kill();
            }
          },
          mouseMove: function ($event) {
            $event.preventDefault();
            if (this.is_touch_device)
              return;
            this.mouseX = $event.pageX;
            this.mouseY = $event.pageY;
            this.move();
          },
          move: function () {
            this.endDragTime = new Date();
            this.dx = this.mouseX - this.mousePreviousX;
            this.dy = this.mouseY - this.mousePreviousY;
            if (this._mouseDown && !this._flickingX) {
              this._dragging = true;
              this.offsetX += this.dx * (3 * (this.zoomMax + 0.1 - this.zoom));
              $('.engine-position').css({ 'left': this.offsetX });
            }
            if (this._mouseDown && !this._flickingY) {
              this._dragging = true;
              this.offsetY += this.dy * (3 * (this.zoomMax + 0.1 - this.zoom));
              $('.engine-position').css({ 'top': this.offsetY });
            }
            this.mousePreviousX = this.mouseX;
            this.mousePreviousY = this.mouseY;
          },
          mouseUp: function ($event) {
            $event.preventDefault();
            if (this.is_touch_device)
              return;
            trace('mouseUp');
            this.up();
          },
          up: function () {
            this.endDragTime = new Date();
            this._mouseDown = false;
            this._dragging = false;
            this.flick();
          },
          flick: function () {
            var that = this;
            var dTime = this.endDragTime - this.startDragTime;
            if (dTime === 0)
              return;
            var velX = this.dx / dTime;
            var velY = this.dy / dTime;
            //flick
            if (!this._flickingX && Math.abs(velX) > 0.15 || Math.abs(velY) > 0.15) {
              this._flickingX = true;
              this.offsetX += 3000 * velX;
              this.flickTweenX = TweenMax.to($('.engine-position'), 1, {
                css: { left: that.offsetX },
                onComplete: function () {
                  that._flickingX = false;
                  $scope.$apply();
                }
              });
            }
            if (!this._flickingY && Math.abs(velX) > 0.15 || Math.abs(velY) > 0.15) {
              this._flickingY = true;
              this.offsetY += 3000 * velY;
              this.flickTweenY = TweenMax.to($('.engine-position'), 1, {
                css: { top: that.offsetY },
                onComplete: function () {
                  that._flickingY = false;
                  $scope.$apply();
                }
              });
            }
          }
        };
      touchService.setupTouchEvents();
      return touchService;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').controller('ErrorController', [
    '$scope',
    '$element',
    'ErrorService',
    'BaseController',
    function ($scope, $element, ErrorService, BaseController) {
      var controller = {
          errorService: null,
          el: null,
          onInit: function () {
            this.el = $element;
            this.errorService = ErrorService;
          }
        };
      angular.extend(controller, new BaseController($scope));
      controller.init($element);
      return controller;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Modals').factory('ErrorModal', [
    'btfModal',
    function (btfModal) {
      return btfModal({
        controllerAs: 'DebugCtrl',
        templateUrl: 'main/core/modals/errorModal/error.tpl.html',
        wrapperUrl: 'main/core/overlay-containers/fullscreen/overlay.tpl.html'
      });
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('ErrorService', function () {
    return {
      errorMessage: null,
      dataSaved: function (data) {
        this.errorMessage = data;
      },
      setErrorMessage: function (data) {
      }
    };
  });
}());(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').controller('SuccessController', [
    '$scope',
    '$element',
    'BaseController',
    function ($scope, $element, BaseController) {
      var controller = {
          el: null,
          onInit: function () {
            this.el = $element;
          }
        };
      angular.extend(controller, new BaseController($scope));
      controller.init($element);
      return controller;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Modals').factory('SuccessModal', [
    'btfModal',
    function (btfModal) {
      return btfModal({
        templateUrl: 'main/core/modals/successModal/success.tpl.html',
        wrapperUrl: 'main/core/overlay-containers/fullscreen/overlay.tpl.html'
      });
    }
  ]);
}());angular.module('FScapeApp.Models').factory('configModel', [
  'BaseModel',
  'configService',
  '$q',
  function (BaseModel, configService, $q) {
    // let's just use this since the data is so small yet everything depends on it
    // no sense in making an async call here.
    var defaults = {
        'totalPages': 820,
        'cdnVersion': 'v12',
        'cdnPrefix': 'http://d2zwcujesf1bgv.cloudfront.net/',
        'basePath': 'prod/:version/images/',
        'pathThumbnail': 'tiny_preload_size',
        'pathWebsize': 'websize_1024',
        'license': null,
        'tileWidth': 1004,
        'tileHeight': 768,
        'startPage': 719
      };
    var model = new BaseModel(defaults, configService);
    model.getConfig = function () {
      var that = this;
      var deferred = $q.defer();
      if (that.data === null) {
        this.service.getConfig().then(function (result) {
          that.data = result.data;
          deferred.resolve(that.data);
        }, function (error) {
          that.data = fallback;
        });
      } else {
        deferred.resolve(this.data);
      }
      return deferred.promise;
    };
    return model;
  }
]);(function () {
  'use strict';
  var modelName = 'config';
  var serviceName = modelName + 'Service';
  angular.module('FScapeApp.Services').factory(serviceName, [
    'BaseHttpService',
    '$http',
    function (BaseHttpService, $http) {
      var service = new BaseHttpService();
      service.modelName = modelName;
      service.servicePath = modelName.toLowerCase();
      service.getConfig = function () {
        var url = this.buildResourcePath() + 'foreverscape.json';
        return $http({
          url: url,
          method: 'GET',
          data: {},
          params: {}
        });
      };
      return service;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('globalModelService', function () {
    return {
      updatedData: null,
      successCallback: null,
      dataSaved: function (data) {
        this.updatedData = data;
        if (this.successCallback) {
          this.successCallback(this.updatedData);
        }
      },
      setSuccessCallback: function (func) {
        this.successCallback = func;
      }
    };
  });
}());angular.module('FScapeApp.Models').factory('gridModel', [
  'configModel',
  'tileModel',
  function (configModel, tileModel) {
    var defaults = [];
    var model = {
        gridBoxes: [],
        init: function () {
          var that = this;
          configModel.getConfig().then(function () {
            tileModel.getTiles().then(function () {
              for (var i = 0; i < 150; i++) {
                var color = 16711680;
                var startPage = configModel.data.startPage;
                var rowOffset = 0;
                var colOffset = 0;
                var tileOffset = 0 + startPage;
                if (i >= 50 && i < 100) {
                  rowOffset = -9;
                  colOffset = 5;
                  color = 65280;
                  tileOffset = -40 + startPage;
                }
                if (i >= 100) {
                  rowOffset = -18;
                  colOffset = 10;
                  color = 255;
                  tileOffset = -80 + startPage;
                }
                var tileId = i + tileOffset;
                if (tileId > configModel.data.totalPages) {
                  tileId = Math.abs(tileId - configModel.data.totalPages);
                }
                that.gridBoxes.push({
                  id: i,
                  domId: 'grid-' + i,
                  transientId: i,
                  isOnScreen: false,
                  row: Math.floor(i / 5) + rowOffset,
                  col: i % 5 + colOffset,
                  width: configModel.data.tileWidth,
                  height: configModel.data.tileHeight,
                  currentTile: tileModel.tiles[i + tileOffset],
                  currentTileId: tileId,
                  x: 0,
                  y: 0,
                  color: color
                });
              }
              for (var i = 0; i < that.gridBoxes.length; i++) {
                var gb = that.gridBoxes[i];
                gb.x = gb.col * gb.width;
                gb.y = gb.row * gb.height;
                gb.thumbSrc = tileModel.tiles[i].thumbUrl;
              }
            });
          });
        }
      };
    model.init();
    return model;
  }
]);angular.module('FScapeApp.Models').factory('tileModel', [
  'BaseModel',
  'tileService',
  'configModel',
  'generalUtils',
  '$q',
  function (BaseModel, tileService, configModel, generalUtils, $q) {
    var defaults = [];
    var model = new BaseModel(defaults, tileService);
    var cachedTilesPromise;
    model.tiles = [];
    model.getTiles = function () {
      var that = this;
      console.log(printStackTrace());
      return configModel.getConfig().then(function () {
        that.createTiles();
        if (that.tiles) {
          that.cachedTilesPromise = $q.when(that.tiles);
        }
        if (!that.cachedTilesPromise) {
          that.cachedTilesPromise = that.service.getTiles().then(function (result) {
            that.data = that.updateTileData(result.data);
          });
        }
        return that.cachedTilesPromise;
      });
    };
    model.updateTileData = function (data) {
      for (var i = 0; i < configModel.data.totalPages; i++) {
        this.tiles[i].name = data.names[i];
      }
    };
    model.createTiles = function (data) {
      var tiles = [];
      var config = configModel.data;
      for (var i = 0; i < configModel.data.totalPages; i++) {
        var tile = {
            id: i,
            index: i,
            row: Math.floor(i / 5),
            col: i % 5,
            name: '..',
            absoluteX: i * config.tileWidth,
            absoluteY: 0,
            thumbUrl: generalUtils.path.combine(config.cdnPrefix, config.basePath.replace(':version', config.cdnVersion), config.pathThumbnail, 'forever_' + generalUtils.string.pad(i + 1, '0', 4) + '.jpg'),
            fullUrl: generalUtils.path.combine(config.cdnPrefix, config.basePath.replace(':version', config.cdnVersion), config.pathWebsize, 'forever_' + generalUtils.string.pad(i + 1, '0', 4) + '.jpg')
          };
        tiles.push(tile);
      }
      this.tiles = tiles;
      return tiles;
    };
    return model;
  }
]);(function () {
  'use strict';
  var modelName = 'tile';
  var serviceName = modelName + 'Service';
  angular.module('FScapeApp.Services').factory(serviceName, [
    'BaseHttpService',
    '$http',
    function (BaseHttpService, $http) {
      var service = new BaseHttpService();
      service.modelName = modelName;
      service.servicePath = modelName.toLowerCase();
      service.getTiles = function () {
        var url = this.buildResourcePath() + 'tiles2000.json';
        return $http({
          url: url,
          method: 'GET',
          data: {},
          params: {}
        });
      };
      return service;
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Controllers').controller('overlayController', [
    '$scope',
    '$element',
    '$controller',
    function ($scope, $element, $controller) {
      var controller = {
          scope: null,
          overlay: null,
          showHelpIcon: false,
          showCloseIcon: true,
          showOverlay: false,
          deactivateOnShadowClick: true,
          init: function ($scope, $element) {
            var that = this;
            this.scope = $scope;
            this.overlay = $element;
            this.$scope = $scope;
            $('body').addClass('noscroll');
            this.showOverlay = true;
            $scope.$on('$destroy', function () {
            });
            $scope.$on('closeOverlay', function () {
              that.close();
            });
            this.defineListeners();
          },
          defineListeners: function () {
          },
          undefineListeners: function () {
          },
          onShadowClick: function (e) {
            if (this.deactivateOnShadowClick && this.overlay && e.target === this.overlay[0]) {
              this.close();
            }
          },
          close: function () {
            $('body').removeClass('noscroll');
            //TODO: ANIMATE HERE
            // DESTROY LISTENERS
            //- ANIMATE
            //- AFTER ANIMATE
            //- REMOVE ELEMENT
            angular.element(this.overlay).remove();  // the following would destroy the outter shell too!! Don't do it.
                                                     //this.scope.$destroy();
          },
          show: function () {
            this.showOverlay = true;
            this.defineListeners();
            this.scope.$digest();
          }
        };
      controller.init($scope, $element);
      return controller;
    }
  ]);
}());(function () {
  'use strict';
  var constantsModule = angular.module('konst', []);
  constantsModule.factory('enums', function () {
    var enums = {};
    if (Object.hasOwnProperty('freeze')) {
      Object.freeze(enums);
    }
    return enums;
  });
}());(function () {
  'use strict';
  /*
 * @license
 * angular-modal v0.3.0
 * (c) 2013 Brian Ford http://briantford.com
 * License: MIT
 */
  'use strict';
  angular.module('FScapeApp.Modals').factory('btfModal', [
    '$animate',
    '$compile',
    '$rootScope',
    '$controller',
    '$q',
    '$http',
    '$templateCache',
    function ($animate, $compile, $rootScope, $controller, $q, $http, $templateCache) {
      return function modalFactory(config) {
        if (!(!config.template ^ !config.templateUrl)) {
          throw new Error('Expected modal to have exactly one of either `template` or `templateUrl`');
        }
        var template = config.template, controller = config.controller || angular.noop, controllerAs = config.controllerAs, container = angular.element(config.container || document.body), wrapperHtml = null, templateHtml = null, outterElem = null, innerElem = null, element = null, callbackSuccess = null, callbackError = null, html, scope;
        if (config.template) {
          var deferred = $q.defer();
          deferred.resolve(config.template);
          // TODO: use case of no wrapper?
          html = deferred.promise;
        } else {
          templateHtml = $http.get(config.templateUrl, { cache: $templateCache }).then(function (response) {
            return response.data;
          });
          wrapperHtml = $http.get(config.wrapperUrl, { cache: $templateCache }).then(function (response) {
            return response.data;
          });
        }
        function activate(locals, cbSuccess, cbError) {
          callbackSuccess = cbSuccess;
          callbackError = cbError;
          return $q.all({
            tHtml: templateHtml,
            wHtml: wrapperHtml
          }).then(function (results) {
            attach(results, locals);
          });
        }
        function attach(results, locals) {
          outterElem = angular.element(results.wHtml);
          innerElem = angular.element(results.tHtml);
          if (outterElem.length === 0 || innerElem.length === 0) {
            throw new Error('The template contains no elements; you need to wrap text nodes');
          }
          outterElem.find('overlay-content').append(innerElem);
          $animate.enter(outterElem, container);
          scope = $rootScope.$new();
          if (locals) {
            for (var prop in locals) {
              scope[prop] = locals[prop];
            }
          }
          var ctrl = $controller(controller, { $scope: scope });
          ctrl.success = callbackSuccess;
          ctrl.error = callbackError;
          if (controllerAs) {
            scope[controllerAs] = ctrl;
          }
          $compile(outterElem)(scope);
        }
        function deactivate() {
          e;
          var deferred = $q.defer();
          if (element) {
            $animate.leave(element, function () {
              scope.$destroy();
              element = null;
              deferred.resolve();
            });
          } else {
            deferred.resolve();
          }
          return deferred.promise;
        }
        function active() {
          return !!element;
        }
        return {
          activate: activate,
          deactivate: deactivate,
          active: active
        };
      };
    }
  ]);
}());(function () {
  'use strict';
  angular.module('FScapeApp.Services').factory('generalUtils', function () {
    return {
      path: {
        combine: function () {
          var chunks = [];
          var argumentsArray = [].slice.apply(arguments);
          for (var i = 0; i < argumentsArray.length; i++) {
            var a = argumentsArray[i];
            while (a.charAt(a.length - 1) === '/') {
              a = a.substring(0, a.length - 1);
            }
            chunks.push(a);
          }
          return chunks.join('/');
        }
      },
      string: {
        pad: function (str, padString, length) {
          str = str.toString();
          while (str.length < length)
            str = padString + str;
          return str;
        }
      }
    };
  });
}());