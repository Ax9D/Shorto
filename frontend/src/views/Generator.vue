<template>
  <div class="container">
    <input
      id="url"
      v-model="url"
      v-on:keyup="updateValidity"
      spellcheck="false"
      v-bind:class="{ valid: validURL }"
      v-on:click="updateValidity"
      :disabled="generating"
    />
    <button
      id="generateBtn"
      type="submit"
      v-on:click="generate"
      v-show="validURL && url != ''"
    >
      Generate
    </button>
    <div v-if="generating || urlData" id="status" class="holder">
      <div v-if="urlData">
        <p id="message" v-if="!urlData.error">
          <a v-bind:href="`http://${urlData.link}`">{{ urlData.link }}</a>
        </p>
        <ul class="stuff" v-if="!urlData.error">
          <li>
            <button
              id="copy"
              class="small copy"
              v-on:click="copyToClipboard"
            ></button>
          </li>
          <li>
            <button
              id="analytics"
              class="small analytics"
              v-on:click="openAnalytics"
            ></button>
          </li>
        </ul>
        <p id="error" v-else>
          {{urlData.error.message}}
        </p>
      </div>
      <div v-else class="loading">
        <div class="spinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
const urlUtil = require("../../../common/utils.js");

const GENERATEAPI =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.VUE_APP_ROOT_API}${process.env.VUE_APP_GENERATE_ENDPOINT}`
    : `${process.env.VUE_APP_ROOT_API}${process.env.VUE_APP_GENERATE_ENDPOINT}`;

export default {
  name: "App",
  data: () => {
    return {
      validURL: false,
      url: "",
      urlData: null,
      generating: false,
    };
  },
  methods: {
    updateValidity: function () {
      if (this.urlData) this.urlData = null;
      return (this.validURL = urlUtil.validUrl(this.url));
    },
    generate: async function () {
      this.generating = true;
      let url = this.url;
      this.url = "";
      this.validURL = false;

      const recaptchaToken = await this.$recaptcha("generate");
      try {
        let response = await fetch(GENERATEAPI, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url,
            recaptchaToken,
          }),
        });
        this.generating = false;

        if (response.status == 200) {
          let res = await response.json();
          console.log(res);
          this.urlData = res;
          if ("error" in res) {
            //TODO: pretty error messages
          } else {
            this.urlData.link = `ax9d.github.io/short/${this.urlData.shortID}`;
          }
        } else {
          throw new Error("Couldn't reach server");
        }
      } catch (err) {
        console.log(err);
      }
    },
    copyToClipboard: function () {
      let r = document.createRange();
      r.selectNode(document.getElementById("message"));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(r);
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
    },
    openAnalytics: function () {
      this.$router.push(`analytics/${this.urlData.analyticsID}`);
    },
  },
};
</script>

<style>
.container {
  position: absolute;

  top: 40%;
  left: 50%;
  transform: translateX(-50%);

  width: 50%;
  padding: 20px;
  min-width: 500px;
  min-height: 65px;

  max-width: 600px;
}
#status {
  width: 100%;
}
input#url {
  width: 96%;
  height: 40px;
}
button#generateBtn {
  border-radius: 50px;
  background-size: 300% 100%;
  background-image: linear-gradient(
    to right,
    #0ba360,
    #3cba92,
    #30dd8a,
    #2bb673
  );
  background-image: linear-gradient(
    90deg,
    rgba(31, 142, 240, 1) 0%,
    rgba(55, 30, 245, 1) 53%
  );
  /*background-image:linear-gradient(to right, rgba(51,95,208,1) 0%, rgba(98,74,212,1) 100%);*/

  /*background-image: linear-gradient(to right, rgba(51,95,208,1) 0%, rgba(98,74,212,1) 52%, rgba(133,74,212,1) 100%);*/
  display: block;
  margin-left: auto;
  margin-right: auto;
}
button#generateBtn:hover {
  background-position: 100% 0;
  -o-transition: all 0.4s ease-in-out;
  -webkit-transition: all 0.4s ease-in-out;
  transition: all 0.4s ease-in-out;
  filter: none;
}

button#generateBtn:focus {
  outline: none;
  box-shadow: 0px 0px 0px px rgb(15, 100, 173);
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
  background-image: url("../assets/copy.svg");
  background-position: 50% 50%;
}

.analytics {
  background-image: url("../assets/analytics.svg");
  background-position: 50% 50%;
}
p#message {
  font-size: 150%;
  text-align: left;
  padding-left: 20%;
}
p#error {
  color:#be2626c2;
  font-size: 150%;
  text-align: center;
}
</style>
