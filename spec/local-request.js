var request = require("request");
var config = require("./config");


module.exports = function(tags, onResponse, onFailure) {
    var options =
    {
        method: "POST",
        uri: "http://localhost:" + config.port + "/v1/albums",
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        json: tags
    };

    request(options, function(error, response, data) {
        if(response.statusCode == 200) {
            onResponse(data);
            return;
        }

        onFailure(data, response.statusCode);
    });
}