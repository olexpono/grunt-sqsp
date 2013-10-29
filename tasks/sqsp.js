/*
 * See grunt-sqsp
 * https://github.com/tholex/grunt-sqsp
 *
 * Copyright (c) 2013 Olex Ponomarenko
 * Licensed under the MIT license.
 */

'use strict';
var Translator = require('../libs/translator');
var prompt = require('prompt');
var ejs = require('ejs');
var fs = require('fs');

var commandMap = {
  deploy: deployToRemote,
  build: buildDirectory
};
var gruntRef;

function deployToRemote( options ) {
  var done = this.async();
  gruntRef.log.writeln("Deploying "+ (options.buildDir).green + " to remote: " + (options.remote).green);
  gruntRef.util.async.series([
    git(options.buildDir, ['init']),
    git(options.buildDir, ['checkout', '--orphan', options.branch]),
    git(options.buildDir, ['add', '--all']),
    git(options.buildDir, ['commit', '--message="' + options.deployMessage + '"']),
    git(options.buildDir, ['push', '--prune', '--force', options.remote, options.branch])
    /* should add '--quiet',  */
  ], done);
}

/** Compile ejs files, copy the rest **/
function buildDirectory( options ) {
  var locale;
  gruntRef.log.writeln("Removing any existing files: " + (options.buildDir + "/").yellow);
  gruntRef.log.writeln("Compiling theme into: " + (options.buildDir + "/").green);
  gruntRef.file.delete(options.buildDir);

  // Copy the non-ejs files
  gruntRef.file.expand({
    cwd: options.themeDir,
    filter: function( filepath ) {
      return ( gruntRef.file.isFile( filepath )
               && !filepath.match('\.ejs$')
               && !filepath.match('^template.conf.ejs$') );

    }
  }, "**").forEach(function(filepath) {
    gruntRef.file.copy(options.themeDir + '/' + filepath, options.buildDir + '/' + filepath);
  });

  if (gruntRef.file.exists(options.themeDir + "/template.conf.ejs")) {
    buildTemplateDotConf(options);
  }

  var localesArray = Object.keys(options.locales);
  for (var locIndex = 0; locIndex < localesArray.length; locIndex++) {
    if (Object.prototype.hasOwnProperty.call(options.locales, localesArray[locIndex])) {
      gruntRef.log.writeln( "buildForLocale : then options.locales");
      gruntRef.log.writeln(localesArray[locIndex]);
      buildForLocale(options, localesArray[locIndex]);
    }
  }
};

function buildTemplateDotConf( options ) {
  // defaults, based on base Squarespace developer setup
  options.layoutName = options.layoutName || 'default';
  options.regionFilename = options.regionFilename || 'site';
  var locale;
  var navigationName;
  var templateFile = fs.readFileSync(options.themeDir + "/template.conf.ejs", 'utf8');
  var renderedTemplate;
  var templateData = options;
  var sqspLayouts = {};
  var sqspNavigations = buildNonI18nNavigations(options);
  var makeLayout = function(loc) {
    return {
             name: options.locales[loc].name,
             regions: [ (options.regionFilename + getLocaleSuffix(options, loc)) ]
           };
  };

  var makeNavigation = function(navName, loc) {
    return {
             name: (navName + getLocaleSuffix(options, loc)),
             title: getNiceLocalePrefix(options, loc) + options.navigations[navName].title
           };
  };

  for (locale in options.locales) {
    if (Object.prototype.hasOwnProperty.call(options.locales, locale)) {
      sqspLayouts[ options.layoutName + getLocaleSuffix(options, locale) ] = makeLayout(locale);

      /* For each locale, create i18n copies of each navigation with international: true */
      for (navigationName in options.navigations) {
        if (Object.prototype.hasOwnProperty.call(options.navigations, navigationName)) {
          if (options.navigations[navigationName].international == true) {
            sqspNavigations.push( makeNavigation(navigationName, locale) );
          }
        }
      }
    }
  }

  templateData["sqspLayouts"] = JSON.stringify(sqspLayouts);
  templateData["sqspNavigations"] = JSON.stringify(sqspNavigations);

  gruntRef.log.writeln("Template Data", templateData);
  renderedTemplate = ejs.render(templateFile, templateData);
  gruntRef.log.write("Writing template.conf... ");
  gruntRef.file.write( options.buildDir + "/template.conf", renderedTemplate);
  gruntRef.log.writeln("done".green);
}

function buildNonI18nNavigations(options) {
  var nonI18nNavs = [];
  var navName;
  for (navName in options.navigations) {
    if (Object.prototype.hasOwnProperty.call(options.navigations, navName)) {
      if (!options.navigations[navName].international) {
        gruntRef.log.writeln("Creating Nav :: " + options.navigations[navName].title || (navName + "Navigation"));
        nonI18nNavs.push({
          name: navName,
          title: options.navigations[navName].title || (navName + "Navigation")
        });
        gruntRef.log.writeln("Added Non-i18n Navigation :: " + navName);
      }
    }
  }
  return nonI18nNavs;
}

function getLocaleSuffix( options, locale ) {
  return (locale == options.defaultLocale) ? "" : ("-" + locale);
}

function getNiceLocalePrefix( options, locale ) {
  return (locale == options.defaultLocale) ? "" : (options.locales[locale].name + " ");
}
function getLocalePathPrefix( options, locale ) {
  return (locale == options.defaultLocale) ? "" : (locale + "/");
}

function buildForLocale( options, locale ) {
  var localeSuffix = getLocaleSuffix(options, locale);
  var localePrefix = getNiceLocalePrefix(options, locale);
  var localePathPrefix = getLocalePathPrefix(options, locale);

  if (locale == options.defaultLocale) {
    gruntRef.log.writeln("Building for DEFAULT locale.");
    gruntRef.log.writeln(localeSuffix + "||" + localePrefix + "||" + localePathPrefix);
    gruntRef.log.writeln("defaultLocale = " + options.defaultLocale);
  }
  // For japan , prefix is "Japan ", suffix is "-jp"
  //  gruntRef.log.writeln("Building for Locale " + locale + ": ");
  //  gruntRef.log.writeflags(options.locales[locale]);
  var templateData = {
    isDefaultLocale: (locale == options.defaultLocale),
    currentLocale: options.locales[locale],
    localePrefix: localePrefix,
    localePathPrefix: localePathPrefix,
    localeSuffix: localeSuffix
  };
  var ejsTranslator = new Translator({
    gruntRef: gruntRef,
    locale: locale,
    locales: Object.keys(options.locales),
    defaultLocale: options.defaultLocale
  });

  // Compile ejs templates into the build target
  //  given baseName.ending.ejs
  //  write baseName{-suffix}.ending
  gruntRef.file.expand({
    cwd: options.themeDir,
    filter: function( filepath ) {
      return ( gruntRef.file.isFile( filepath )
               && filepath.match( '\.ejs$' )
               && !filepath.match( 'template.conf.ejs$' ));
    }
  }, "**" ).forEach( function( filepath ) {
    ejsTranslator.compile_file(options.themeDir + '/' + filepath, templateData, gruntRef, function( compiled_content ) {

      var baseNameIndex = filepath.lastIndexOf(".", filepath.lastIndexOf(".ejs") - 1);
      var baseName = filepath.substring(0, baseNameIndex);
      var ending = filepath.substring(baseNameIndex, filepath.lastIndexOf(".ejs"));
      var outFile = options.buildDir + '/' + baseName + localeSuffix + ending;
      gruntRef.log.writeln('Writing translated file ' + outFile.green)
      gruntRef.file.write(outFile, compiled_content);
    });
  });
};

/** Utility to run Git Commands in some directory cwd */
function git(cwd , args) {
  return function(cb) {
    gruntRef.log.writeln('Running git ' + args.join(' ').green);
    gruntRef.util.spawn({
      cmd: 'git',
      args: args,
      opts: {cwd: cwd }
    }, cb);
  };
};

module.exports = function(grunt) {
  gruntRef = grunt;
  grunt.registerMultiTask('sqsp', 'Build and push Squarespace themes.', function(operation) {
    var options = this.options({
      buildDir: 'build',
      themeDir: 'theme',
      branch: 'master',
      deployMessage: 'sqsp-autobuild',
      staging: false
    });

    if (!options.remote) {
      grunt.fail.warn("The URL to a Squarespace git remote is required.");
      return false;
    }

    if(commandMap.hasOwnProperty(operation)) {
      commandMap[operation].call(this, options);
    }
    else {
      commandMap["build"].call(this, options);
      commandMap["deploy"].call(this, options);
      if (!options.staging) {
        gruntRef.log.writeln(("Deploying to production instance.").yellow);
      }
    }
  });
};

