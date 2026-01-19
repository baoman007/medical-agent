// pages/history/history.js
Page({
  data: {
    historyList: []
  },

  onLoad(options) {
    console.log('历史记录页面加载')
    this.loadHistory()
  },

  onShow() {
    // 每次显示页面都重新加载
    this.loadHistory()
  },

  // 加载历史记录
  loadHistory() {
    try {
      const history = wx.getStorageSync('consultationHistory') || []
      this.setData({
        historyList: history
      })
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  },

  // 查看历史详情
  viewHistory(e) {
    const item = e.currentTarget.dataset.item
    const content = `${item.result.content || '暂无详细回复'}`

    wx.showModal({
      title: '问诊详情',
      content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      showCancel: false,
      confirmText: '确定'
    })
  }
})
