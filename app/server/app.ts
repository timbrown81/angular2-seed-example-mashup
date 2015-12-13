import * as express from 'express';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import * as logger from 'morgan';
import * as socketIO from 'socket.io';
import {RtBroker} from './RtBroker';

var mongoskin = require('mongoskin');   //Using require since there is not tsd file

import {ApiRouting} from './routing/ApiRouting';

var config = {
    staticRoot: '',
	port: 3000,
	mongo_url: process.env.CELLDATA_URL || 'mongodb://@localhost:27017/celldata',
    mongo_animal_url: process.env.ANIMALS_URL || 'mongodb://@localhost:27017/animals'
};

if (process.env.PORT) {
    config.port = parseInt(process.env.PORT);
}

console.log('Configuration: ', config);

//var debug = debug('Mashup');

config.staticRoot = path.join(__dirname, '..');

console.log(`Static root is: ${config.staticRoot}`);


var app = express();

app.use(express.static(config.staticRoot));

app.use(logger('dev'));
app.use(bodyParser({
    limit: '100mb'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

var db = mongoskin.db(config.mongo_url, {safe:true});
var animalsdb = mongoskin.db(config.mongo_animal_url, {safe:true});

//Inject the db into the request object
app.use(function(req, res, next){
    req['db'] = db;
    req['animalsdb'] = animalsdb;
    next();
});


var apiRouteCreator = new ApiRouting(app);
app.use('/api', apiRouteCreator.getApiRoutingConfig());

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

app.use(<express.ErrorRequestHandler> function(err, req, res, next) {
    console.log('Error status is: ', err.status);
    console.log('Error message', err.message || err.msg);

    if (err.status === 200) {
        res.status(500);
    } else {
        res.status(err.status || 500);
    }

    res.send(err);
});

app.set('port', config.port || 3000);

var http_server = require('http').createServer(app);
var io = socketIO(http_server);

http_server.listen(app.get('port'), function() {
     console.log('Express server listening on port ' + app.get('port'));
});

// var express_server = app.listen(app.get('port'), function() {
//     console.log('Express server listening on port ' + express_server.address().port);
// });

var broker = new RtBroker(io);
console.log(`Created real time broker ${broker}`);