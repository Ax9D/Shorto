
const URL=require('url-parse');

const { URLCollection }=require('./constants.js');
const AnalyticsService = require('./AnalyticsService.js');
class URLService
{
    async init(db)
    {
        this.db=await db.get(URLCollection);
        await this.db.createIndex('shortID');
    }
    createRedirect(link,shortID, analyticsID)
    {
        let linkURL=new URL(link);
        if(linkURL.protocol=='')
            link='http://'+link; //Guess http 
    
        let analytics=AnalyticsService.defaultData();

        console.log(`${shortID} --> ${link}`);

        //Return original promise
        return this.db.insert({shortID,link,analyticsID,analytics});
    }
    getData(shortID)
    {
        let entryPromise=this.db.findOne({shortID});
        return entryPromise;
    }
}

module.exports=new URLService();