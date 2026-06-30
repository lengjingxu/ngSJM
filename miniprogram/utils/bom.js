const { connectorRules } = require('../data/materials')

function distance(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz))
}

function groupBy(items, keyGetter) {
  return items.reduce((acc, item) => {
    const key = keyGetter(item)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

function calculateBeamLengths(project) {
  const nodeMap = project.nodes.reduce((acc, node) => {
    acc[node.id] = node
    return acc
  }, {})

  return project.beams.map((beam) => {
    const from = nodeMap[beam.from]
    const to = nodeMap[beam.to]
    const length = beam.length || distance(from, to)
    return {
      ...beam,
      length,
      cutLength: beam.cutLength || length
    }
  })
}

function calculateCuts(beams) {
  const groups = groupBy(beams, (beam) => `${beam.profileCode}-${beam.cutLength}`)
  return Object.keys(groups).map((key) => {
    const [profileCode, cutLength] = key.split('-')
    return {
      profileCode,
      cutLength: Number(cutLength),
      quantity: groups[key].length,
      beamIds: groups[key].map((beam) => beam.id)
    }
  }).sort((a, b) => b.cutLength - a.cutLength)
}

function calculateConnectors(project, beams) {
  const mode = project.connectionMode || 'angle-bracket'
  const rule = connectorRules[mode]
  const nodeDegree = {}

  beams.forEach((beam) => {
    nodeDegree[beam.from] = (nodeDegree[beam.from] || 0) + 1
    nodeDegree[beam.to] = (nodeDegree[beam.to] || 0) + 1
  })

  const connectedNodes = Object.keys(nodeDegree).filter((nodeId) => nodeDegree[nodeId] >= 2)

  if (mode === 'angle-bracket') {
    // MVP 近似：每个连接节点按 degree - 1 计算角码。
    const angleBracketCount = connectedNodes.reduce((sum, nodeId) => sum + Math.max(nodeDegree[nodeId] - 1, 1), 0)
    return [
      { code: 'angle-bracket', name: rule.label, quantity: angleBracketCount },
      { code: 'bolt', name: '内六角螺栓', quantity: angleBracketCount * rule.boltPerBracket },
      { code: 'slot-nut', name: '滑块螺母', quantity: angleBracketCount * rule.slotNutPerBracket }
    ]
  }

  if (mode === 'hidden-connector') {
    const count = beams.length * 2 * rule.connectorPerBeamEnd
    return [
      { code: 'hidden-connector', name: rule.label, quantity: count },
      { code: 'bolt', name: '内六角螺栓', quantity: count * rule.boltPerConnector }
    ]
  }

  if (mode === 'tapping-bolt') {
    const count = beams.length * 2 * rule.tappingPerBeamEnd
    return [
      { code: 'tapping', name: '端面攻丝', quantity: count },
      { code: 'bolt', name: '端面连接螺栓', quantity: count * rule.boltPerTapping }
    ]
  }

  return [
    { code: 'multi-way-connector', name: rule.label, quantity: connectedNodes.length * rule.connectorPerNode }
  ]
}

function calculatePanels(project) {
  const panels = project.panels || []
  const groups = groupBy(panels, (panel) => `${panel.material}-${panel.width}-${panel.height}-${panel.thickness}`)
  return Object.keys(groups).map((key) => {
    const [material, width, height, thickness] = key.split('-')
    return {
      material,
      width: Number(width),
      height: Number(height),
      thickness: Number(thickness),
      quantity: groups[key].length,
      panelIds: groups[key].map((panel) => panel.id)
    }
  })
}

function calculateBom(project, options = {}) {
  const wasteRate = options.wasteRate ?? 0.08
  const beams = calculateBeamLengths(project)
  const totalProfileLength = beams.reduce((sum, beam) => sum + beam.cutLength, 0)

  return {
    profiles: [
      {
        profileCode: project.profile.code,
        totalLength: totalProfileLength,
        totalLengthMeter: Number((totalProfileLength / 1000).toFixed(2)),
        totalLengthWithWaste: Math.ceil(totalProfileLength * (1 + wasteRate)),
        wasteRate
      }
    ],
    cuts: calculateCuts(beams),
    connectors: calculateConnectors(project, beams),
    panels: calculatePanels(project),
    summary: {
      beamCount: beams.length,
      totalProfileLength,
      totalProfileLengthWithWaste: Math.ceil(totalProfileLength * (1 + wasteRate)),
      wasteRate
    }
  }
}

module.exports = {
  calculateBom,
  calculateBeamLengths
}
