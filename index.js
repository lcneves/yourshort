var PORT = process.env.PORT || 8080,
    DB_USER = 'yourshortuser',
//    DB_PASSWORD = 'This is the Your Short DB user password, but no.',
    DB_PASSWORD = 'ThisistheYourShortDBuserpasswordbutno',
    DB_URL = 'mongodb://' + DB_USER + ':' + DB_PASSWORD + '@ds037215.mongolab.com:37215/yourshort',
    mongoHelper = require('./mongo-helper.js'),
    collection,
    express = require('express'),
    app = express();
    
    // Testing requirements
var util = require('util');

app.get('/', function (req, res) {
    res.send('Usage: go to ' + req.headers.host + '/new/{URL} to create a new short URL.');
});

app.get('/new/*', function (req, res) {
    var url = req.path.slice(5);
    collection.findOne({url: url}, function(err, result) {
        if (result) {
            res.send({
                original_url: result.url,
                short_url: req.headers.host + '/' + result._id
            });
        } else {
            if (url.slice(0, 7) == 'http://' || url.slice(0, 8) == 'https://') {
                collection.find().sort({_id: -1}).toArray(function(err, urlArray) {
                    if (err) {console.log(err); res.end();}
                    else {
                        var http = url.slice(0, 5) == 'https' ? require('https') : require('http');
                        var request = http.get(url, function(httpResponse) {
                            var newID = urlArray.length > 0 ? urlArray[0]._id + 1 : 1;
                            collection.insert({_id: newID, url: url}, function(err, data) {
                                if (err) {console.log(err); res.end;}
                                else {
                                    res.send({
                                        original_url: url,
                                        short_url: req.headers.host + '/' + newID
                                    });
                                }
                            });
                        });
                        request.on('error', function(err) {
                            res.send({error: err});
                        });
                    }
                });
            } else {
                res.send({error: "Malformed URL: needs to start with http:// or https://"});
            }
        }
    });
});

app.get('/*', function (req, res) {
    var query = parseInt(req.path.slice(1));
    collection.findOne({_id: query}, function(err, data) {
        if (err) {console.log(err); res.end();}
        else {
            if (data) {
                res.redirect(data.url);
            } else {
                res.send({error: "Short URL not found"});
            }
        }
    });
});

mongoHelper.init(DB_URL, function (error) {
    if (error) { throw error; }
    collection = mongoHelper.db.collection('urls');
    app.listen(PORT, function() {
        console.log('Start listening on port ' + PORT);
    });
});