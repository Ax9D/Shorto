const urlRegex=/^[(http(s)?)://(www\.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$/;
module.exports={
       validUrl : function(url){
              return urlRegex.test(url);
       }
};