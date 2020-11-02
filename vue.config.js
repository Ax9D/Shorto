module.exports = {
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
