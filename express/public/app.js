var sha1 = require('sha1');
var string2Sha1 = function(string){
    return sha1(string);
}
global.window.string2Sha1 = string2Sha1;
