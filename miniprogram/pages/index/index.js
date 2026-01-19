// pages/index/index.js
const app = getApp()

Page({
  data: {
    symptomText: '',
    loading: false,
    showResult: false,
    urgencyText: '',
    urgencyClass: 'low',
    resultContent: '',
    consultationHistory: []
  },

  onLoad(options) {
    console.log('页面加载')
    // 加载历史记录
    this.loadHistory()
  },

  // 症状输入
  onSymptomInput(e) {
    this.setData({
      symptomText: e.detail.value
    })
  },

  // 添加症状
  addSymptom(e) {
    const symptom = e.currentTarget.dataset.symptom
    const currentText = this.data.symptomText.trim()
    const newText = currentText ? currentText + '、' + symptom : symptom
    this.setData({
      symptomText: newText
    })
  },

  // 提交问诊
  async submitConsultation() {
    const message = this.data.symptomText.trim()

    if (!message) {
      wx.showToast({
        title: '请描述您的症状',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 显示加载状态
    this.setData({
      loading: true,
      showResult: false
    })

    try {
      const apiBaseUrl = app.globalData.apiBaseUrl
      console.log('请求地址:', `${apiBaseUrl}/api/consult`)
      console.log('请求消息:', message)

      // 调用后端 API
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${apiBaseUrl}/api/consult`,
          method: 'POST',
          data: {
            message: message
          },
          header: {
            'content-type': 'application/json'
          },
          success: resolve,
          fail: reject
        })
      })

      console.log('服务器响应:', res)
      const result = res.data
      console.log('响应数据:', result)

      if (!result) {
        throw new Error('服务器未返回数据')
      }

      if (result.success === false) {
        throw new Error(result.error || '服务器返回错误')
      }

      // 显示结果
      this.setData({
        loading: false,
        showResult: true,
        resultContent: result.content || '暂无详细回复'
      })

      // 设置紧急程度
      this.setUrgency(result.urgency)

      // 保存到历史记录
      this.saveHistory(message, result)

      wx.showToast({
        title: '问诊完成',
        icon: 'success',
        duration: 1500
      })
    } catch (error) {
      console.error('问诊失败:', error)
      this.setData({
        loading: false
      })
      wx.showToast({
        title: '问诊失败: ' + (error.message || '请检查网络连接'),
        icon: 'none',
        duration: 3000
      })
    }
  },

  // 设置紧急程度
  setUrgency(urgency) {
    const urgencyMap = {
      emergency: { text: '🚨 紧急 - 建议立即就医', class: 'emergency' },
      high: { text: '⚠️ 高度关注 - 建议尽快就医', class: 'high' },
      medium: { text: '⚡ 中等 - 建议观察并咨询医生', class: 'medium' },
      low: { text: '✓ 轻微 - 可在家观察', class: 'low' }
    }
    const config = urgencyMap[urgency] || urgencyMap.low
    this.setData({
      urgencyText: config.text,
      urgencyClass: config.class
    })
  },

  // 保存历史记录
  saveHistory(message, result) {
    const historyItem = {
      id: Date.now(),
      message,
      result,
      timestamp: new Date().toLocaleString()
    }

    const history = this.data.consultationHistory
    history.unshift(historyItem)

    // 只保留最近 20 条
    if (history.length > 20) {
      history.splice(20)
    }

    this.setData({
      consultationHistory: history
    })

    // 保存到本地存储
    wx.setStorageSync('consultationHistory', history)
  },

  // 加载历史记录
  loadHistory() {
    try {
      const history = wx.getStorageSync('consultationHistory') || []
      this.setData({
        consultationHistory: history
      })
    } catch (error) {
      console.error('加载历史记录失败:', error)
    }
  }
})
