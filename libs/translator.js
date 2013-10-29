var i18n = require("i18n");
var ejs = require("ejs");
var fs = require('fs');
var gruntRef;

var Translator = function(options) {
  this.locale = options.locale;

  if (typeof(this.locale) === "string") {
  } else {
    options.gruntRef.log.writeln("WTF ERROR :: locale not a string!".red);
  }

  if (typeof(options.defaultLocale) === "string") {
  } else {
    options.gruntRef.log.writeln("WTF ERROR :: defaultLocale not a string!".red);
  }

  var localesArray;
  if (this.locale === options.defaultLocale) {
    localesArray = [this.locale];
  } else {
    localesArray = [this.locale, options.defaultLocale];
  }

  i18n.configure({
    locales: localesArray,
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
  /* if (typeof(templateData) == "function" &&
      callback == undefined) {
    callback = templateData;
  }
  */

  /* Set up the rendering data / context */
  templateData["t"] = i18n.__;

  rendered = ejs.render(file, templateData);

  if (callback != undefined) {
    callback(rendered);
  } else {
    return rendered;
  }
}

module.exports = Translator;


