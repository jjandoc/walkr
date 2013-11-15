var DEV_MODE = true,
    currentLocation;

Parse.initialize("qoSmyDZZvuaYLkvi5uAEwR6DAx2OQABk4DXMIIeG", "hWpPY4HIHh2eF0d2C2Xwc08pF919gjM3TeDPQ2OO");
Parse.$ = jQuery;

// Template loader from: https://github.com/Gazler/Underscore-Template-Loader
var templateLoader = {
    templateVersion: '0.0.1',
    templates: {},
    loadRemoteTemplate: function(templateName, filename, callback) {
        if (!this.templates[templateName]) {
            var self = this;
            jQuery.get(filename, function(data) {
                self.addTemplate(templateName, data);
                self.saveLocalTemplates();
                callback(data);
            });
        } else {
            callback(this.templates[templateName]);
        }
    },
    addTemplate: function(templateName, data) {
        this.templates[templateName] = data;
    },
    localStorageAvailable: function() {
        try {
            return 'localStorage' in window && window.localStorage !== null;
        } catch (e) {
            return false;
        }
    },
    saveLocalTemplates: function() {
        if (this.localStorageAvailable && !DEV_MODE) {
            localStorage.setItem('templates', JSON.stringify(this.templates));
            localStorage.setItem('templateVersion', this.templateVersion);
        }
    },
    loadLocalTemplates: function() {
        if (this.localStorageAvailable) {
            var templateVersion = localStorage.getItem('templateVersion');
            if (templateVersion && templateVersion === this.templateVersion) {
                var templates = localStorage.getItem('templates');
                if (templates) {
                    templates = JSON.parse(templates);
                    for (var x in templates) {
                        if (!this.templates[x]) {
                            this.addTemplate(x, templates[x]);
                        }
                    }
                }
            } else {
                localStorage.removeItem('templates');
                localStorage.removeItem('templateVersion');
            }
        }
    }
};
templateLoader.loadLocalTemplates();


// models
var Walk = Parse.Object.extend('Walk', {
    // instance methods
    addWalker : function(user) {
        var thisWalk = this;
        thisWalk.relation('participants').add(user);
        // notify organizer here of new participant
        thisWalk.save();
    }
}, {
    // class methods
    create : function(options) {
        var organizer = options.organizer,
            startLocation = options.startLocation,
            startTime = options.startTime,
            walk = new Walk;
        walk.set('organizer', organizer);
        walk.set('startLocation', startLocation);
        walk.set('startTime', startTime);
        walk.set('active', true);
        return walk;
    }
});

// views
var AppView = Parse.View.extend({
    events : {},
    initialize : function() {
        var thisView = this,
            navigatorError = function() {
                // give notification that geolocation is necessary
            };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var coords = position.coords || position.coordinate || position;
                currentLocation = new Parse.GeoPoint({
                    latitude: coords.latitude,
                    longitude: coords.longitude
                });
                $.getScript('//connect.facebook.com/en_UK/all.js', function(){
                    Parse.FacebookUtils.init({
                      appId      : '612532842138130',                        // App ID from the app dashboard
                      channelUrl : '//walkr.parseapp.com/channel.html', // Channel file for x-domain comms
                      status     : true,                                 // Check Facebook Login status
                      xfbml      : true                                  // Look for social plugins on the page
                    });
                    thisView.render();
                });
            }, navigatorError());
        } else {
            navigatorError();
        }
    },
    render : function() {
        if (Parse.User.current()) {
            new LoggedInView();
        } else {
            new LoggedOutView();
        }
    }
});
var LoggedInView = Parse.View.extend({
    events : {
        'click .btn-logout' : 'logout',
        'click .walk' : 'viewWalk',
        'click .btn-start-walk' : 'startWalk',
        'click .btn-join' : 'joinWalk'
    },
    el : '#app-container',
    initialize : function() {
        this.render();
    },
    render : function() {
        var data = {},
            thisView = this;
        templateLoader.loadRemoteTemplate('loggedInView', '/templates/loggedInView.html', function(template) {
            var compiled = _.template(template);
            thisView.$el.html(compiled(data));
            thisView.delegateEvents();
        });
    },
    logout : function() {
        Parse.User.logOut();
    },
    startWalk : function() {
        var walk = Walk.create({
            organizer : Parse.User.current(),
            startLocation : currentLocation,
            startTime : new Date()
        });
        console.log('starting a walk')
        walk.save(null, {
            success : function() {
                console.log('walk saved');
            },
            error : function(error) {
                console.error(error);
            }
        });
    },
    viewWalk : function() {

    },
    joinWalk : function() {

    }
});
var LoggedOutView = Parse.View.extend({
    events : {
        'click .btn-fb-login' : 'fbLogin'
    },
    el : '#app-container',
    initialize : function() {
        this.render();
    },
    render : function() {
        var data = {},
            thisView = this;
        templateLoader.loadRemoteTemplate('loggedOutView', '/templates/loggedOutView.html', function(template) {
            var compiled = _.template(template);
            thisView.$el.html(compiled(data));
            thisView.delegateEvents();
        });
    },
    fbLogin : function() {
        Parse.FacebookUtils.logIn(null, {
            success: function(user) {
                if (!user.existed()) {
                    // new user
                } else {
                    // existing user
                }
                new LoggedInView()
          },
          error: function(user, error) {
              console.log("User cancelled the Facebook login or did not fully authorize.");
          }
        });
    }
});
var DashboardView = Parse.View.extend({
    events : {

    },
    initialize : function() {

    },
    render : function() {

    }
});

// router

new AppView();