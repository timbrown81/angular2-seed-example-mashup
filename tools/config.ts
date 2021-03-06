import {readFileSync} from 'fs';
import {argv} from 'yargs';
import {normalize, join} from 'path';
import * as chalk from 'chalk';

// --------------
// Configuration.

const ENVIRONMENTS = {
  DEVELOPMENT: 'dev',
  PRODUCTION: 'prod'
};

export const PORT                 = argv['port']        || 5555;
export const PROJECT_ROOT         = normalize(join(__dirname, '..'));
export const ENV                  = getEnvironment();
export const DEBUG                = argv['debug']       || false;
export const DOCS_PORT            = argv['docs-port']   || 4003;
export const APP_BASE             = argv['base']        || '/';

export const APP_TITLE            = 'Angular Mashup';
export const APP_SRC              = 'src';
export const TEST_SRC             = 'src';
export const SERVER_SRC           = 'server';
export const ENABLE_HOT_LOADING   = !!argv['hot-loader'];
export const HOT_LOADER_PORT      = 5578;
export const BOOTSTRAP_MODULE     = ENABLE_HOT_LOADING ? 'hot_loader_main' : 'main';
export const ASSETS_SRC           = `${APP_SRC}/assets`;
export const BOOTSTRAP_FONTS_SRC  = `node_modules/bootstrap/dist/fonts`;
export const TOOLS_DIR            = 'tools';
export const TMP_DIR              = 'tmp';
export const TEST_SPEC_DEST       = 'dist/test/spec';
export const TEST_E2E_DEST        = 'dist/test/e2e';
export const DOCS_DEST            = 'docs';
export const APP_DEST             = `dist/${ENV}`;
export const SERVER_DEST          = `dist/server`;
export const ASSETS_DEST          = `${APP_DEST}/assets`;
export const CSS_DEST             = `${APP_DEST}/css`;
export const BOOTSTRAP_FONTS_DEST = `${APP_DEST}/fonts`;  // used in prod to copy bootstrap fonts
export const JS_DEST              = `${APP_DEST}/js`;
export const APP_ROOT             = ENV === 'dev' ? `${APP_BASE}${APP_DEST}/` : `${APP_BASE}`;
export const VERSION              = appVersion();

export const CSS_PROD_BUNDLE      = 'all.css';
export const JS_PROD_SHIMS_BUNDLE = 'shims.js';
export const JS_PROD_APP_BUNDLE   = 'app.js';

export const VERSION_NPM          = '2.14.2';
export const VERSION_NODE         = '4.0.0';

if (ENABLE_HOT_LOADING) {
  console.log(chalk.bgRed.white.bold('The hot loader is temporary disabled.'));
  process.exit(0);
}

interface InjectableDependency {
  src: string;
  inject: string | boolean;
  dest?: string;
}

// Declare NPM dependencies (Note that globs should not be injected).
export const DEV_NPM_DEPENDENCIES: InjectableDependency[] = normalizeDependencies([
  { src: 'systemjs/dist/system-polyfills.src.js', inject: 'shims', dest: JS_DEST },
  { src: 'reflect-metadata/Reflect.js', inject: 'shims', dest: JS_DEST },
  { src: 'es6-shim/es6-shim.js', inject: 'shims', dest: JS_DEST },
  { src: 'systemjs/dist/system.src.js', inject: 'shims', dest: JS_DEST },
  { src: 'angular2/bundles/angular2-polyfills.js', inject: 'shims', dest: JS_DEST },
  { src: 'rxjs/bundles/Rx.js', inject: 'libs', dest: JS_DEST },
  { src: 'angular2/bundles/angular2.js', inject: 'libs', dest: JS_DEST },
  { src: 'angular2/bundles/router.js', inject: 'libs', dest: JS_DEST },
  { src: 'angular2/bundles/http.js', inject: 'libs', dest: JS_DEST },

  { src: 'bootstrap/dist/css/bootstrap.css', inject: true, dest: CSS_DEST },
  { src: 'jquery-ui/themes/base/jquery-ui.css', inject: true, dest: CSS_DEST },
  { src: 'intl/dist/Intl.js', inject: 'shims', dest: JS_DEST },  // Fixes Safari Intl support
  { src: 'intl/locale-data/jsonp/en.js', inject: 'shims', dest: JS_DEST } // Need this too.
]);

export const PROD_NPM_DEPENDENCIES: InjectableDependency[] = normalizeDependencies([
  { src: 'systemjs/dist/system-polyfills.src.js', inject: 'shims' },
  { src: 'reflect-metadata/Reflect.js', inject: 'shims' },
  { src: 'es6-shim/es6-shim.min.js', inject: 'shims' },
  { src: 'systemjs/dist/system.js', inject: 'shims' },
  { src: 'angular2/bundles/angular2-polyfills.min.js', inject: 'libs' },

  { src: 'bootstrap/dist/css/bootstrap.css', inject: true, dest: CSS_DEST },
  { src: 'jquery-ui/themes/base/jquery-ui.css', inject: true, dest: CSS_DEST },
  { src: 'intl/dist/Intl.js', inject: 'shims'},  // Fixes Safari Intl support
  { src: 'intl/locale-data/jsonp/en.js', inject: 'shims'} // Need this too.
]);

// Declare local files that needs to be injected
export const APP_ASSETS: InjectableDependency[] = [
  { src: `${ASSETS_SRC}/main.css`, inject: true, dest: CSS_DEST }
];


export const DEV_DEPENDENCIES = DEV_NPM_DEPENDENCIES.concat(APP_ASSETS);
export const PROD_DEPENDENCIES = PROD_NPM_DEPENDENCIES.concat(APP_ASSETS);

// ----------------
// SystemsJS Configuration.
const SYSTEM_CONFIG_DEV = {
  defaultJSExtensions: true,
  shim : {
        'bootstrap'     : { 'deps' :['jquery'] },
        'jquery-ui/*'   : { 'deps' :['jquery'] }
  },
  paths: {
    [BOOTSTRAP_MODULE]: `${APP_BASE}${BOOTSTRAP_MODULE}`,
    'angular2/*': `${APP_BASE}angular2/*`,
    'd3' : `${APP_BASE}node_modules/d3/d3`,
    'moment' : `${APP_BASE}node_modules/moment/moment`,
    'rxjs/*': `${APP_BASE}rxjs/*`,
    'redux' : `${APP_BASE}node_modules/redux/dist/redux`,
    'socket.io-client' : `${APP_BASE}node_modules/socket.io-client/socket.io`,
    'underscore' : `${APP_BASE}node_modules/underscore/underscore`,
    'jquery' : `${APP_BASE}node_modules/jquery/dist/jquery.js`,
    'jquery-ui/*' : `${APP_BASE}node_modules/jquery-ui/*.js`,
    'bootstrap' : `${APP_BASE}node_modules/bootstrap/dist/js/bootstrap.js`,
    '*': `${APP_BASE}node_modules/*`
  },
  packages: {
    angular2: { defaultExtension: false },
    rxjs: { defaultExtension: false }
  }
};

export const SYSTEM_CONFIG = SYSTEM_CONFIG_DEV;

export const SYSTEM_BUILDER_CONFIG = {
  defaultJSExtensions: true,
  shim : {
        'bootstrap'     : { 'deps' :['jquery'] },
        'jquery-ui/*'   : { 'deps' :['jquery'] }
  },
  paths: {
    '*': `${TMP_DIR}/*`,
    'angular2/*': 'node_modules/angular2/*',
    'rxjs/*': 'node_modules/rxjs/*',
    'd3' : 'node_modules/d3/d3.js',     // For some reason on Heroku, the .js is required
    'moment' : 'node_modules/moment/moment.js',
    'redux' : 'node_modules/redux/dist/redux.js',
    'socket.io-client' : 'node_modules/socket.io-client/socket.io.js',
    'underscore' : 'node_modules/underscore/underscore.js',
    'jquery' : 'node_modules/jquery/dist/jquery.js',
    'jquery-ui/*' : 'node_modules/jquery-ui/*.js',
    'bootstrap' : 'node_modules/bootstrap/dist/js/bootstrap.js'
  }
};

// --------------
// Private.

function normalizeDependencies(deps: InjectableDependency[]) {
  deps
    .filter((d:InjectableDependency) => !/\*/.test(d.src)) // Skip globs
    .forEach((d:InjectableDependency) => d.src = require.resolve(d.src));
  return deps;
}

function appVersion(): number|string {
  var pkg = JSON.parse(readFileSync('package.json').toString());
  return pkg.version;
}

function getEnvironment() {
  let base:string[] = argv['_'];
  let prodKeyword = !!base.filter(o => o.indexOf(ENVIRONMENTS.PRODUCTION) >= 0).pop();
  if (base && prodKeyword || argv['env'] === ENVIRONMENTS.PRODUCTION) {
    return ENVIRONMENTS.PRODUCTION;
  } else {
    return ENVIRONMENTS.DEVELOPMENT;
  }
}
