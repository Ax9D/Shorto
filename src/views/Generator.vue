<template>
<div style="">
    <div class="container">
      <input
        id="url"
        v-model="url"
        v-on:keyup="updateValidity"
        spellcheck="false"
        v-bind:class="{ valid: validURL }"
      />
      <button
        id="generateBtn"
        type="submit"
        v-on:click="generate"
        v-show="validURL"
      >
        Generate
      </button>
      <div id="status" class="holder" v-if="urlData">
        <p id="message">{{ urlData.shortID }}</p>
        <ul class="stuff">
          <li>
            <button id="copy" class="small copy" v-on:click="copyToClipboard"></button>
          </li>
          <li>
            <button id="analytics" class="small analytics" v-on:click="openAnalytics"></button>
          </li>
        </ul>
      </div>
    </div>
    </div>
</template>
<script>
const errors = require("../../../modules/errors.js");
const urlUtil = require("../../../modules/urlUtil.js");
export default {
  name: "App",
  data: () => {
    return {
      message: "",
      validURL: false,
      url: "",
      urlData: null,
    };
  },
  methods: {
    updateValidity: function () {
      if (this.urlData) this.urlData = null;
      return (this.validURL = urlUtil.validUrl(this.url));
    },
    generate: function () {
      fetch("/api/generate", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: this.url,
        }),
      })
        .then((response) => response.json())
        .then((res) => {
          console.log(res);
          if ("error" in res) {
            switch (res.error.code) {
              case errors.INVALID_URL.code:
                this.validURL = false;
                this.message = res.error.message;
                break;
            }
          } else {
            this.urlData = res;
            this.validURL=false;  
          }
        })
        .catch(function (err) {
          console.log("Couldn't reach server");
          console.log(err);
        });
      this.url="";
    },
    copyToClipboard:function()
    {
        let r = document.createRange();
        r.selectNode(document.getElementById("message"));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(r);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
    },
    openAnalytics:function()
    {
        this.$router.push(`analytics/${this.urlData.analyticsID}`);
    }
  }
};
</script>

<style>
.container {
  position:absolute;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  width: 50%;
  padding: 20px;
  min-width: 500px;
  min-height: 65px;

  max-width: 600px;
}
#status{
  width:100%;
}
input#url{
    width:96%;
    height:40px;
}
ul.stuff {
  position: absolute;
  list-style-type: none;
  padding: 0;
  margin: 0;
  left: 75%;
  top: 15%;
}

ul.stuff li {
  display: inline;
  margin: 0;
  padding: 0;
}

ul.stuff li button {
  display: inline-block;
}

.copy {
  background-image: url("../../../public/copy.svg");
  background-position: 50% 50%;
}

.analytics {
  background-image: url("../../../public/analytics.svg");
  background-position: 50% 50%;
}
p#message {
  font-size: 150%;
}
</style>
