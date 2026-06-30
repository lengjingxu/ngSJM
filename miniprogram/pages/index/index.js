const { createDeskProject } = require('../../utils/templates')

Page({
  data: {
    projects: []
  },

  onShow() {
    this.loadProjects()
  },

  loadProjects() {
    const app = getApp()
    const projects = wx.getStorageSync(app.globalData.storageKey) || []
    this.setData({ projects })
  },

  createDemoProject() {
    const app = getApp()
    const projects = wx.getStorageSync(app.globalData.storageKey) || []
    const project = createDeskProject()
    const nextProjects = [project, ...projects]
    wx.setStorageSync(app.globalData.storageKey, nextProjects)
    wx.navigateTo({
      url: `/pages/editor/editor?id=${project.id}`
    })
  },

  openProject(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/editor/editor?id=${id}`
    })
  }
})
