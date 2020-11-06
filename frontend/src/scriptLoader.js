module.exports={
    load:function(src){
        return new Promise(resolve=>{
        let script = document.createElement('script');
        script.setAttribute('src', src);

        script.onload=()=>resolve();

        document.head.appendChild(script);
        console.log(`Loaded ${src}`);
    });
}
};