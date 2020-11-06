const MD5 = require('md5.js');
const {nanoid}=require('nanoid');

const { shortURLNChars , IDCollection,initialPopulateAmount }=require('./constants.js');

class Generator
{
    async init(db)
    {
        if(shortURLNChars>8)
            throw new Error("shortURL size too large"); // Don't want to use BigInt

        this.db=await db.get(IDCollection);


        this.IDRegex=new RegExp(`^[A-z0-9-_]{${shortURLNChars}}$`);
        this.analyticsRegex=new RegExp(`^[A-z0-9-_]{22}$`);

        const IDCount=await this.db.count();

        if(IDCount==0)
        {
            console.log(`Populating collection: ${IDCollection}`);
            await this.generateAll(initialPopulateAmount); // because heroku 
            
        }
        const IDsLeft=await this.db.count({used:false});
        console.log(`IDs left: ${IDsLeft}`);
    }
    /*toBase64(n)
    {
        let ret="";
        while(n!=0)
        {
            ret=base64[n%64] + ret;
            n>>=6;
        }
        let l=ret.length;
        let lowest=base64[0];
        for(let i=0;i<shortURLNChars-l;i++)
            ret=lowest+ret;
        
        return ret;
    } */
    /*
    async generateNew(n)    
    {
        let highest=(await this.db.query(`SELECT MAX(value) FROM ${IDCollection}`)).rows[0].max;

        highest=highest==null?0:highest;

        let newIDs=[];

        for(let i=highest+1;i<=highest+n;i++)
        {
            let shortID=this.toBase64(i);
            let analyticsID=new MD5().update( shortID+nanoid(15) ).digest('base64')
            .replace(/\+/g,"-"); // Replace + with -, url friendly

            analyticsID=analyticsID.substring(0,analyticsID.length-2); // Remove last two padded '_' s


            console.log(analyticsID);

            let entry=[ i, shortID , analyticsID ];

            newIDs.push(entry);
        }
        try
        {
        //Terrible code
            await this.db.query(format(insertBulk,newIDs));
        }
        catch(e)
        {
            console.log(e);
        }

    }*/
    potentiallyValidShortID(id)
    {
        return this.IDRegex.test(id);
    }
    potentiallyValidAnalyticsID(id)
    {
        return this.analyticsRegex.test(id);
    }
    async generateAll(n)    
    {
        let newIDs=new Set();

        let idPairs=[];

        let prev=Date.now();

        let collisions=0;
        for(let i=0;i<n;i++)
        {
            let shortID=nanoid(shortURLNChars);
            while(newIDs.has(shortID))
            {
                shortID=nanoid(shortURLNChars);
                collisions++;
            }
            
            newIDs.add(shortID);

            let analyticsID=new MD5().update( shortID+nanoid(15) ).digest('base64')
            .replace(/\+/g,"-") // Replace + with -, url friendly
            .replace(/\//g,"_");// Replace / with _, url friendly
            analyticsID=analyticsID.substring(0,analyticsID.length-2); // Remove last two padded '=' 

            let idPair={shortID , analyticsID, used:false};

            idPairs.push(idPair);
        }
        try
        {  
            console.log(`ID Generation took ${(Date.now()-prev)/1000} s with ${collisions} collisions`);
            await this.db.insert(idPairs);
            console.log(`Committed ${idPairs.length} id pairs to DB`);
        }
        catch(e)
        {
            throw e;
        }

    }
    async get()
    {
        let idPair;
        try
        {
            idPair=await this.db.findOneAndUpdate({used:false},{$set:{used:true}});
        }
        catch(e)
        {throw e};

        return {
            shortID:idPair.shortID,
            analyticsID:idPair.analyticsID,
        };
    }  
}
module.exports=new Generator();