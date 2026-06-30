function createNode(id, x, y, z) {
  return { id, x, y, z }
}

function createBeam(id, from, to, axis, profileCode, label) {
  return { id, from, to, axis, profileCode, label }
}

function createDeskProject(params = {}) {
  const width = params.width || 2000
  const height = params.height || 750
  const depth = params.depth || 600
  const profileCode = params.profileCode || '4040'

  const nodes = [
    createNode('n-front-left-bottom', 0, 0, 0),
    createNode('n-front-right-bottom', width, 0, 0),
    createNode('n-back-left-bottom', 0, 0, depth),
    createNode('n-back-right-bottom', width, 0, depth),
    createNode('n-front-left-top', 0, height, 0),
    createNode('n-front-right-top', width, height, 0),
    createNode('n-back-left-top', 0, height, depth),
    createNode('n-back-right-top', width, height, depth)
  ]

  const beams = [
    createBeam('b-leg-fl', 'n-front-left-bottom', 'n-front-left-top', 'y', profileCode, '前左桌腿'),
    createBeam('b-leg-fr', 'n-front-right-bottom', 'n-front-right-top', 'y', profileCode, '前右桌腿'),
    createBeam('b-leg-bl', 'n-back-left-bottom', 'n-back-left-top', 'y', profileCode, '后左桌腿'),
    createBeam('b-leg-br', 'n-back-right-bottom', 'n-back-right-top', 'y', profileCode, '后右桌腿'),
    createBeam('b-top-front', 'n-front-left-top', 'n-front-right-top', 'x', profileCode, '前上横梁'),
    createBeam('b-top-back', 'n-back-left-top', 'n-back-right-top', 'x', profileCode, '后上横梁'),
    createBeam('b-top-left', 'n-front-left-top', 'n-back-left-top', 'z', profileCode, '左上纵梁'),
    createBeam('b-top-right', 'n-front-right-top', 'n-back-right-top', 'z', profileCode, '右上纵梁'),
    createBeam('b-bottom-back', 'n-back-left-bottom', 'n-back-right-bottom', 'x', profileCode, '后下横撑')
  ]

  const panels = [
    {
      id: 'p-desktop',
      type: 'desktop',
      x: 0,
      y: height,
      z: 0,
      width,
      height: depth,
      thickness: 25,
      material: 'plywood',
      label: '桌面板'
    }
  ]

  return {
    id: `project-${Date.now()}`,
    name: params.name || '2000×600 铝型材书桌',
    template: 'desk',
    unit: 'mm',
    size: { width, height, depth },
    profile: { code: profileCode },
    connectionMode: params.connectionMode || 'angle-bracket',
    nodes,
    beams,
    panels,
    accessories: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
}

module.exports = {
  createDeskProject
}
