var DEV_MODE = true;

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


// router