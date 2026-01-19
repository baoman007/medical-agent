App({
  onLaunch() {
    console.log('小程序启动')
  },
  globalData: {
    userInfo: null,
    apiBaseUrl: 'http://192.168.10.166:3001' // 你的后端服务地址
  }
})
