<template>
  <p id="error" v-if="error">{{ error.message }}</p>
</template>

<script>
let REDIRECTAPI;
export default {
  data: function () {
    return {
      error: null,
    };
  },
  mounted: function () {
    let shortID = this.$route.params.shortID;


    REDIRECTAPI=process.env.NODE_ENV === "production"
    ? `https://${process.env.VUE_APP_ROOT_API}${process.env.VUE_APP_REDIRECT_ENDPOINT}`
    : `${process.env.VUE_APP_ROOT_API}${process.env.VUE_APP_REDIRECT_ENDPOINT}`;


    fetch(`${REDIRECTAPI}${shortID}`)
      .then((response) => {
        if (response.status == 200) return response.json();
        else throw new Error("Couldn't reach server");
      })
      .then((res) => {
        console.log(res);
        if ("error" in res) this.error = res.error;
        else {
          location.href = res.link;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  },
};
</script>
<style scoped>
p#error {
  color: #e83f33;
}
</style>
