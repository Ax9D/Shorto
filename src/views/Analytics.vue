<template>
  <div id="analytics">
    <p>Anyone with this link can view this information</p>
    <p>Updated Live 🔴</p>
    <div id="dataBlock" v-show="connected">
      <div class="holder" id="clicks">
        <p
          style="
            position: absolute;
            top: -5%;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
          "
        >
          Clicks
        </p>
        <p id="clicks">{{ clicks }}</p>
      </div>
      <div class="holder" id="map">
        <div id="regions_div" ref="regions_div"></div>
        <div id="extraInfo">
          <transition-group name="countriesList" tag="ol">
            <li v-for="data in countries" :key="data[0]">
              {{ data[0] }} - {{ data[1] }}
            </li>
          </transition-group>
        </div>
      </div>
    </div>
    <div v-show="!connected" class="spinner">
      <div class="bounce1"></div>
      <div class="bounce2"></div>
      <div class="bounce3"></div>
    </div>
  </div>
</template>
<script>
const scriptLoader = require("../scriptLoader.js");
const codeToCountry = require("../codeToCountry.js");
const errors = require("../../../modules/errors.js");

var google;

const chartOptions = {
  backgroundColor: {
    fill: "#191a1a",
    stroke: "white",
    strokeWidth: "2px",
  },
  datalessRegionColor: "#343332",
  colorAxis: {
    colors: [
      /*'#174185','#0d2242'*/ /*"#536c95", "#3b6180", "#c76064"*/
      /*"#3cba92"*/
      "#087847",
      "#2bb673",
      "#57deb3",
    ],
  },
  legend: {
    textStyle: { color: "black", fontName: "Raleway" },
  },
  enableRegionInteractivity: false,
};
let chart;
let chartData;
const ANALYTICSWSS =
  process.env.NODE_ENV === "production"
    ? `wss://${process.env.VUE_APP_ROOT_API}${process.env.VUE_APP_ANALYTICS_ENDPOINT}`
    : "ws://localhost:8020/analytics";

let rowLookup = {};

function redrawMap() {
  chart.draw(chartData, chartOptions);
}
export default {
  data: () => {
    return {
      shortID: null,
      link: null,
      analyticsID: null,
      connected: false,
      clicks: 121320013992,
      mapData: {},
      chart: null,
      countries: {
        Xhodila: { clicks: 1 },
        Xhount: { clicks: 3 },
        XicXic: { clicks: 2 },
      },
    };
  },
  methods: {
    connect: function () {
      return new Promise((resolve, reject) => {
        const socket = new WebSocket(ANALYTICSWSS);
        console.log(ANALYTICSWSS);
        socket.addEventListener("open", () => {
          socket.send(JSON.stringify({ analyticsID: this.analyticsID }));
        });
        let initTimeout = setTimeout(() => {
          socket.close();
          reject(errors.CONNECTION_TIMED_OUT);
        }, 5000);

        let _ = (event) => {
          let data = JSON.parse(event.data);
          console.log(data);

          clearTimeout(initTimeout);

          socket.removeEventListener("message", _);

          if ("error" in data) reject(data.error);
          else resolve({ socket, data });
        };
        socket.addEventListener("message", _);
      });
    },
    setup: async function (
      connectedCallback,
      updateCallback,
      disconnectCallback
    ) {
      try {
        let { socket, data } = await this.connect();
        connectedCallback(data);
        console.log(socket);
        socket.addEventListener("message", function (event) {
          updateCallback(JSON.parse(event.data));
        });
        socket.addEventListener("close", function () {
          disconnectCallback();
          console.log("Trying to reconnect in 5 s");
          setTimeout(() => {
            this.setup(connectedCallback, updateCallback, disconnectCallback);
          }, 5000);
        });
      } catch (error) {
        switch (error.code) {
          case errors.CONNECTION_TIMED_OUT.code:
            disconnectCallback();

            console.log("Trying to reconnect in 5 s");
            setTimeout(() => {
              this.setup(connectedCallback, updateCallback, disconnectCallback);
            }, 5000);
            break;
          case errors.INVALID_ANALYTICS_ID.code:
            console.log(errors.message);
            break;
        }
      }
    },
    updateCountries: function (updates) {
      console.log(chartData);
      for (let update of updates) {
        let countryCode = update[0];
        let clicks = update[1];
        let countryName = codeToCountry[countryCode];
        if (countryName in rowLookup)
          chartData.setCell(rowLookup[countryName], 1, clicks);
        else {
          let newRow = chartData.addRow([countryCode, clicks]);
          rowLookup[countryName] = newRow;
        }
        this.mapData[countryName] = clicks;
      }

      this.countries = Object.entries(this.mapData);

      this.countries.sort(function (a, b) {
        return b[1] - a[1];
      });

      redrawMap();
      //Force update vue
      this.countries.push();
    },
  },
  mounted: async function () {
    await scriptLoader.load("https://www.gstatic.com/charts/loader.js");
    google = window.google;
    this.analyticsID = this.$route.params.analyticsID;
    console.log(this.analyticsID);

    google.charts.load("current", {
      packages: ["geochart"],
      // Note: you will need to get a mapsApiKey for your project.
      // See: https://developers.google.com/chart/interactive/docs/basic_load_libs#load-settings
      mapsApiKey: "AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY",
    });
    google.charts.setOnLoadCallback(() => {
      chartData = new google.visualization.DataTable();

      chartData.addColumn("string", "Country");
      chartData.addColumn("number", "Clicks");
      chart = new google.visualization.GeoChart(this.$refs["regions_div"]);
      redrawMap();

      this.setup(
        (data) => {
          this.connected = true;
          this.clicks = data.analytics.clicks;
          this.shortID = data.shortID;
          this.link = data.link;

          this.updateCountries(Object.entries(data.analytics.regionData));
        },
        (updates) => {
          console.log(updates.clicks);
          this.clicks = updates.clicks;
          this.updateCountries(updates.regionData);
        },
        () => {
          this.connected = false;
        }
      );
    });
  },
};
</script>
<style scoped>
.spinner {
  width: 70px;
  text-align: center;

  position: absolute;
  top: 50%;
  left: 50%;

  transform: translate(-50%, -50%);
}

.spinner > div {
  width: 18px;
  height: 18px;
  background-color: rgb(143, 143, 143);

  border-radius: 100%;
  display: inline-block;
  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  animation: sk-bouncedelay 1.4s infinite ease-in-out both;
}

.spinner .bounce1 {
  -webkit-animation-delay: -0.32s;
  animation-delay: -0.32s;
}

.spinner .bounce2 {
  -webkit-animation-delay: -0.16s;
  animation-delay: -0.16s;
}

@-webkit-keyframes sk-bouncedelay {
  0%,
  80%,
  100% {
    -webkit-transform: scale(0);
  }
  40% {
    -webkit-transform: scale(1);
  }
}

@keyframes sk-bouncedelay {
  0%,
  80%,
  100% {
    -webkit-transform: scale(0);
    transform: scale(0);
  }
  40% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }
}

.holder {
  margin: 20px;
}
div#dataBlock {
  position: relative;
  top: 10%;
  width: 80%;

  left: 50%;
  transform: translateX(-50%);
}
div#clicks {
  min-width: 300px;
  height: 100px;
  width: 25%;
  max-width: 200px;

  left: 50%;
  transform: translateX(-50%);
}
div#map {
  min-width: 100px;
  width: auto;
  height: 374px;
  padding: 20px;

  display: flex;
  align-items: center;
}
p#clicks {
  font-size: 200%;
}
#regions_div {
  float: left;
}
#extraInfo {
  position: relative;
  float: left;
  height: 100%;

  max-height: 100%;
  overflow: hidden;
  overflow-y: auto;
  width: 100%;
}
ol {
  list-style-type: none;
  counter-reset: orderedlist;
}
li {
  margin: 5px;
  padding: 10px;
  border-radius: 5px;
  background-color: #191a1a;
  font-size: 30px;
  text-align: justify;
}
li:before {
  counter-increment: orderedlist;
  content: counter(orderedlist);
}

.countriesList-move {
  transition: transform 0.5s;
}
</style>