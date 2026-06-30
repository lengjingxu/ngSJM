# 数据模型与 BOM 计算逻辑

## 1. 设计原则

铝型材结构可以被抽象为：

- 节点：空间坐标点。
- 杆件：两个节点之间的一根型材。
- 面板：由矩形区域形成的桌面、层板、柜门、背板。
- 连接：节点处不同杆件之间的连接方式。
- 配件：由连接方式和节点关系推导出来。

这套模型不追求工程 CAD 的全部复杂度，而是优先满足装修和定制场景中的报价、沟通、采购。

## 2. Project 项目模型

```ts
type FrameProject = {
  id: string
  name: string
  template: 'wardrobe' | 'desk' | 'shelf' | 'tv-stand' | 'custom'
  unit: 'mm'
  size: {
    width: number
    height: number
    depth: number
  }
  profile: ProfileSpec
  connectionMode: ConnectionMode
  nodes: Node3D[]
  beams: Beam[]
  panels: Panel[]
  accessories: Accessory[]
  bom?: BomResult
  createdAt: number
  updatedAt: number
}
```

## 3. 型材模型

```ts
type ProfileSpec = {
  code: '2020' | '3030' | '4040' | '4080'
  width: number
  height: number
  slot: number
  weightPerMeter?: number
  pricePerMeter?: number
}
```

第一版推荐支持：

| 型号 | 截面 | 常见用途 |
| --- | --- | --- |
| 2020 | 20×20mm | 小型置物架、轻型框架 |
| 3030 | 30×30mm | 书桌、普通柜体 |
| 4040 | 40×40mm | 稳定桌架、电视支架 |
| 4080 | 40×80mm | 承重横梁、大跨度桌架 |

## 4. 节点模型

```ts
type Node3D = {
  id: string
  x: number
  y: number
  z: number
  label?: string
}
```

坐标规则：

- X：宽度方向
- Y：高度方向
- Z：深度方向
- 单位：mm

## 5. 杆件模型

```ts
type Beam = {
  id: string
  from: string
  to: string
  axis: 'x' | 'y' | 'z'
  profileCode: string
  length: number
  cutLength: number
  label?: string
}
```

### 5.1 长度计算

```ts
length = distance(nodeA, nodeB)
```

### 5.2 切割长度

不同连接方式下，切割长度可能不同：

- 角码连接：cutLength = length
- 内置连接件：cutLength = length - profileWidthCorrection
- 端面攻丝：cutLength = length
- 三通连接：cutLength = length - connectorInsertDepth × 2

MVP 可以先让 `cutLength = length`，并在 BOM 中注明未扣连接件补偿。

## 6. 面板模型

```ts
type Panel = {
  id: string
  type: 'desktop' | 'shelf' | 'door' | 'backboard' | 'sideboard'
  x: number
  y: number
  z: number
  width: number
  height: number
  thickness: number
  material: 'plywood' | 'mdf' | 'glass' | 'acrylic' | 'custom'
  label?: string
}
```

## 7. 连接方式模型

```ts
type ConnectionMode =
  | 'angle-bracket'
  | 'hidden-connector'
  | 'tapping-bolt'
  | 'multi-way-connector'
```

## 8. BOM 输出模型

```ts
type BomResult = {
  profiles: ProfileBomItem[]
  cuts: CutItem[]
  connectors: ConnectorBomItem[]
  panels: PanelBomItem[]
  summary: {
    totalProfileLength: number
    totalProfileLengthWithWaste: number
    wasteRate: number
  }
}
```

## 9. BOM 计算规则

### 9.1 型材总长度

```ts
totalProfileLength = sum(beam.cutLength)
```

默认损耗率：

```ts
wasteRate = 0.08
```

```ts
totalProfileLengthWithWaste = totalProfileLength * (1 + wasteRate)
```

### 9.2 切割清单聚合

按 `profileCode + cutLength` 聚合。

示例：

| 型材 | 切割长度 | 数量 |
| --- | ---: | ---: |
| 4040 | 2000mm | 4 |
| 4040 | 600mm | 6 |
| 4040 | 750mm | 4 |

### 9.3 角码连接计算

简化规则：

- 每个有 2 个以上杆件相交的节点，视为连接节点。
- 节点中每形成一个 90° 夹角，默认需要 1 个角码。
- 每个角码需要：
  - 2 个螺栓
  - 2 个滑块螺母

MVP 近似规则：

```ts
angleBracketCount = connectedBeamPairsAtRightAngle
boltCount = angleBracketCount * 2
slotNutCount = angleBracketCount * 2
```

### 9.4 内置连接件计算

简化规则：

- 每根杆件两端各 1 套内置连接件。

```ts
hiddenConnectorCount = beams.length * 2
boltCount = hiddenConnectorCount
```

### 9.5 端面攻丝计算

简化规则：

- 每根杆件两端可能需要攻丝。
- 每个端面连接 1 个螺栓。

```ts
tappingCount = beams.length * 2
boltCount = tappingCount
```

### 9.6 端盖计算

暴露杆端才需要端盖。

MVP 简化：

- 每根独立外露竖杆顶部、底部可选端盖。
- 用户可在参数中选择是否自动增加端盖。

```ts
endCapCount = exposedEnds.length
```

### 9.7 板材计算

按 `material + width + height + thickness` 聚合。

桌面需要增加搭边策略：

- 和外框齐平
- 四周外扩 10-50mm
- 内嵌到型材槽内

## 10. 模板生成策略

### 10.1 书桌模板

输入：

- 宽 width
- 高 height
- 深 depth

生成：

- 4 根竖腿
- 顶部矩形框 4 根
- 底部横撑可选 3-4 根
- 桌面板 1 块

### 10.2 衣柜模板

输入：

- 宽 width
- 高 height
- 深 depth
- 列数 columns
- 层数 rows

生成：

- 外框 12 根基础杆件
- 竖向分隔杆
- 横向层板支撑杆
- 背部加强杆可选
- 层板 / 门板 / 背板可选

### 10.3 电视支架模板

输入：

- 总宽 width
- 高 height
- 深 depth
- 电视宽高

生成：

- 左右立柱
- 上下横梁
- 中部挂载横梁
- 底座支撑
- 加强斜撑可选

## 11. 未来扩展

- 型材真实槽型建模。
- 自动避让门铰链、抽屉轨道。
- 载重估算。
- 结构稳定性提醒。
- 标准长度采购优化：按 6 米型材自动排料。
- 报价单导出。
