var i18n = require("i18n");
var ejs = require("ejs");
var fs = require('fs');
var gruntRef;

var Translator = function(options) {
  this.locale = options.locale;

  i18n.configure({
    locales: options.locales,
    directory: './locales',
    defaultLocale: options.defaultLocale,
    updateFiles: true
  });
};

/* Reads a file and compiles it with EJS with optional templateData */
Translator.prototype.compile_file = function(fullpath, templateData, gruntRef, callback){
  var file, options, rendered;
  file = fs.readFileSync( fullpath, 'utf8' );

  i18n.setLocale(this.locale);

  /* optional templateData */
  if (templateData == undefined) { templateData = {}; };
  if (typeof(templateData) == "function" &&
      callback == undefined) {
    callback = templateData;
  }

  /* Set up the rendering data / context */
  templateData["t"] = i18n.__;
  rendered = ejs.render(file, templateData);

  if (callback != undefined) callback.call(this, rendered);
  else return rendered;
}

module.exports = Translator;


