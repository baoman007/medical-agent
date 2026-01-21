App({
  onLaunch() {
    console.log('小程序启动')
  },
  globalData: {
    userInfo: null,
    // apiBaseUrl: 'http://localhost:3001'
    apiBaseUrl: 'http://192.168.2.156:3001' // 你的后端服务地址
  }
})
