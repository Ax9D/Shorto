<template>
    <p id="error" v-if="error">{{error.message}}</p>
</template>

<script>
export default {
    data:function()
    {
        return {
            error:null,
        };
    },
    mounted:function()
    {
        let shortID=this.$route.params.shortID;
        fetch(`/api/${shortID}`)
        .then((response)=>response.json()).then((res)=>{
            console.log(res);
            if('error' in res)
                this.error=res.error;
            else
            {
                location.href=res.link;
            }
        })
        .catch((err)=>{
            console.log(err);
        });
    }
}
</script>
<style scoped>
p#error
{
    color:#e83f33;
}
</style>
