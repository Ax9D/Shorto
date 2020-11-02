module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/short' : '/' ,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
        ws:true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
