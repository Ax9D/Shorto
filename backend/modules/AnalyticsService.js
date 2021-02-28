
const { URLCollection } = require('./constants.js');
const geoip = require('geoip-lite');
const errors = require('../common/errors.js');

class AnalyticsService {
    async init(db) {
        try {
            this.db = await db.get(URLCollection);
            this.dataConnections = new Map();
        }
        catch (err) { throw err; }
    }
    async addListener(_data, analyticsID, connection) {
        let connectionSet;
        if (!(connectionSet = this.dataConnections.get(analyticsID))) {
            console.log(`Creating new mapping for ${analyticsID}`);
            connectionSet = new Set();
            this.dataConnections.set(analyticsID, connectionSet);
        }

        connection.isAlive = true;

        const pingPongInterval = setInterval(() => {
            if (!connection.isAlive) {
                connection.send(JSON.stringify({ error: errors.CONNECTION_TIMED_OUT }));
                connection.terminate();
            }
            else {
                connection.isAlive = false;
                connection.ping();
            }
        }, 10000);

        connection.on('pong', () => {
            connection.isAlive = true;
        });

        connection.on('close', () => {
            clearInterval(pingPongInterval);

            connectionSet.delete(connection);

            if (connectionSet.size == 0)
                this.dataConnections.delete(analyticsID);
            
            console.log("Closing socket");
        });

        connectionSet.add(connection);

        connection.send(JSON.stringify({
            shortID: _data.shortID,
            link: _data.link,
            analytics:
            {
                clicks:_data.analytics.clicks,
                regionData:_data.analytics.regionData
            } }));

    }
    broadcastUpdates(analyticsID, clicks, regionData) {
        
        //TODO: Optimize
        let connectionSet;
        if (connectionSet = this.dataConnections.get(analyticsID)) {
            for (let connection of connectionSet)
                connection.send( JSON.stringify( { clicks, regionData } ));
        } 
               
    }
    async broadcastUpdatesStaggered()
    {

    }
    async updateData(analyticsID, ip) {
        let geoData = geoip.lookup(ip);

        console.log(geoData);

        let update = {};
        update['analytics.clicks'] = 1;

        //let testData=['IN','US','NO','DE','JP','KR'];
        //geoData.country=testData[Math.floor(Math.random()*testData.length)];
        let knownLocation = geoData && geoData.country;
        if (knownLocation) {
            update[`analytics.regionData.${geoData.country}`] = 1;
        }


        //If the linked is tracked, update the clicks and location data
        let result = await this.db.findOneAndUpdate(
            {
                analyticsID,
                "analytics.tracked": true
            },
            {
                $inc: update
            });

        if (result) {
            let analytics = result.analytics;
            console.log(analytics);
            this.broadcastUpdates(analyticsID,
                analytics.clicks,
                knownLocation ? [[geoData.country, analytics.regionData[geoData.country]]] : []
            );
        }
        else
            console.log("Untracked URL");

    }
    getData(analyticsID) {
        let entryPromise = this.db.findOne({ analyticsID, 'analytics.tracked': true });
        return entryPromise;
    }
    defaultData() {
        return {
            tracked: true,
            clicks: 0,
            clickHistory: [],
            regionData: {},
        };
    }

}
module.exports = new AnalyticsService();