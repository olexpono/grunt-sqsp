# grunt-sqsp

Grunt-based utilities for Squarespace themes, specifically
deployment and internationalization. Developed in concjunction with
[bighuman.com](http://bighuman.com)

## Getting Started
This plugin requires Grunt `0.4.x`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to
create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install ../grunt-sqsp --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-sqsp');
```

## Workflow

Squarespace has git endpoints for deployment of themes. Since
these are also exposed via FTP, they are not a good "definitive" git
repository. The idea with this toolset is to keep your theme code on
GitHub or something similar, and deploy via an equivalent of
`git push --force`. This also allows you to keep Grunt configs and other
meta-data in git while being outside of your theme.

The current working directory's `theme` is built and pushed, regadless
of the state in git, etc. So you can make a small edit, save, and deploy
right away.

In you Gruntfile, you can configure multiple targets, e.g. staging and
your live site. For each target, this library exposes two tasks: build and deploy.
Simply calling `grunt sqsp:target` will build first and then deploy.

## The "sqsp:target:build" task

The build task creates a directory called `./build-{target}/`, with the
compiled contents of `./theme/`. The build directory is wiped first if it exists.

## The "sqsp:target:deploy" task

The deploy task creates a git repository in the build directory for the
target, commits everything as an `--orphan` commit, and pushes
(`--force`) to the Squarespace remote as configured. Note that the git history on
Squarespace will not include the actual deploy history.

## EJS and i18n

Files without `.ejs` are copied from `./theme/` into `./build-{target}/` as-is.

Any files ending with `.ejs` in the theme are copied for each locale and compiled
using target- and locale-specific config variables. `.ejs` endings are stripped when the
compiled files are saved into `./build/`. For example, you would want
a different region `site.region` per locale.

## TODO - explain example config + i18n + navigations

This part of grunt-sqsp is still in flux and might move to another repo,
but your template.conf.ejs file can have layouts and navigations filled
out by grunt-sqsp.

    "layouts" : <%- sqspLayouts %>,
    "navigations" : <%- sqspNavigations %>,


