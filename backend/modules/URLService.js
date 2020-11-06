
const URL=require('url-parse');

const { URLCollection }=require('./constants.js');
const AnalyticsService = require('./AnalyticsService.js');
class URLService
{
    async init(db)
    {
        this.db=await db.get(URLCollection);
        this.db.createIndex('shortID');
    }
    async createRedirect(link,shortID, analyticsID)
    {
        let linkURL=new URL(link);
        if(linkURL.protocol=='')
            link='http://'+link; //Guess http 
    
        console.log(`${shortID} --> ${link}`);
        let analytics=AnalyticsService.defaultData();
        await this.db.insert({shortID,link,analyticsID,analytics});
    }
    async getData(shortID)
    {
        let entry=await this.db.findOne({shortID});
        return entry;
    }
}

module.exports=new URLService();