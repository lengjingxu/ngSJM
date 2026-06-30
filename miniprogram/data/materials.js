const profiles = [
  { code: '2020', name: '欧标 2020 铝型材', width: 20, height: 20, slot: 6, defaultPricePerMeter: 16 },
  { code: '3030', name: '欧标 3030 铝型材', width: 30, height: 30, slot: 8, defaultPricePerMeter: 28 },
  { code: '4040', name: '欧标 4040 铝型材', width: 40, height: 40, slot: 8, defaultPricePerMeter: 45 },
  { code: '4080', name: '欧标 4080 铝型材', width: 40, height: 80, slot: 8, defaultPricePerMeter: 88 }
]

const connectorRules = {
  'angle-bracket': {
    label: '角码连接',
    angleBracketPerRightAngle: 1,
    boltPerBracket: 2,
    slotNutPerBracket: 2
  },
  'hidden-connector': {
    label: '内置连接件',
    connectorPerBeamEnd: 1,
    boltPerConnector: 1
  },
  'tapping-bolt': {
    label: '端面攻丝 + 螺栓',
    tappingPerBeamEnd: 1,
    boltPerTapping: 1
  },
  'multi-way-connector': {
    label: '三通 / 多通连接',
    connectorPerNode: 1
  }
}

module.exports = {
  profiles,
  connectorRules
}
