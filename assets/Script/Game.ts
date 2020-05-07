const { ccclass, property } = cc._decorator
const COLOR = ['#4cb4e7', '#ffc09f', '#c7b3e5', '#588c7e', '#a3a380']

enum Status {
  idle,
  growing,
  falling
}

@ccclass
export default class Game extends cc.Component {

  @property(cc.Label)
  titleLabel: cc.Label = null

  @property(cc.Node)
  blockNode: cc.Node = null

  @property(cc.Node)
  baseLeftNode: cc.Node = null

  @property(cc.Node)
  baseRightNode: cc.Node = null

  @property(cc.Node)
  wallLeftNode: cc.Node = null

  @property(cc.Node)
  wallRightNode: cc.Node = null

  @property(cc.Label)
  counterLabel: cc.Label = null

  private _level: number = 1
  private _score: number = 0
  private _counter: number = 2
  private _bg: cc.Node = null
  private growHandle: cc.Action = null
  private _status: Status = Status.idle

  onLoad() {
    this._bg = cc.find('background', this.node)
    this.node.on('touchstart', this.grow, this)
    this.node.on('touchend', this.stop, this)

  }

  onDestroy() {
    this.node.off('touchstart', this.grow, this)
    this.node.off('touchend', this.stop, this)
  }

  init(): void {
    this._score = 0
    this._level = 1
    this.updateStatus()
    this.setColor()
    this.resetWall()
  }

  updateStatus(): void {
    this.titleLabel.string = `Score: ${this._score}, Level: ${this._level}`
    this.counterLabel.string = this._counter + ''
  }

  placeWall(node: cc.Node, desX: number): void {
    node.runAction(cc.moveTo(0.5, cc.v2(desX, node.y)).easing(cc.easeCubicActionIn()))
  }

  resetWall(): void {
    const baseGap: number = 100 * Math.random() + 100
    const wallGap: number = baseGap + 30 + Math.random() * 50

    this.placeWall(this.baseLeftNode, - baseGap / 2)
    this.placeWall(this.baseRightNode, baseGap / 2)
    this.placeWall(this.wallLeftNode, - wallGap / 2)
    this.placeWall(this.wallRightNode, wallGap / 2)
  }

  grow(): void {
    if (this._status !== Status.idle) return
    this._status = Status.growing
    const seq: cc.ActionInterval = cc.sequence(
      cc.scaleTo(3, 5),
      cc.callFunc(() => {

      })
    )
    this.growHandle = this.blockNode.runAction(seq)
  }

  stop(): void {
    if (this._status !== Status.growing) return
    this._status = Status.falling
    this.blockNode.stopAction(this.growHandle)
    this.dropDown()
  }

  dropDown(): void {
    const blockWidth: number = this.blockNode.width * this.blockNode.scaleX
    let dest: number = -cc.winSize.height / 2 + blockWidth / 2
    const baseGap: number = this.baseRightNode.x - this.baseLeftNode.x
    const wallGap: number = this.wallRightNode.x - this.wallLeftNode.x

    // falling down
    let success = false
    if (blockWidth < baseGap) {
      dest = -1200
    } else if (blockWidth < wallGap) {
      // success
      success = true
      dest += this.baseLeftNode.height
    } else {
      // blocked
      dest += this.baseLeftNode.height + this.wallLeftNode.height - 30
    }
    const seq: cc.ActionInterval = cc.sequence(
      cc.rotateTo(.2, 0),
      cc.moveTo(.5, cc.v2(0, dest)).easing(cc.easeBounceOut()),
      cc.callFunc(() => {
        if (success) {
          this.next()
          return
        }
        cc.director.loadScene('game')
      })
    )
    this.blockNode.runAction(seq)
  }

  setColor(): void {
    const color: cc.Color = cc.Color.BLACK.fromHEX(COLOR[Math.floor(Math.random() * COLOR.length)])
    this._bg.runAction(cc.tintTo(.5, color.getR(), color.getG(), color.getB()))
  }

  next(): void {
    this._score++
    this._counter--
    if (this._counter <= 0) {
      this.levelUp()
    }

    this.updateStatus()
    this.resetWall()
    this.resetBlock()
  }

  levelUp(): void {
    this._level++
    this._counter = 2 * this._level
    this.setColor()
  }

  resetBlock(): void {
    const seq: cc.ActionInterval = cc.sequence(
      cc.spawn(
        cc.scaleTo(.5, 1),
        cc.moveTo(.5, cc.v2(0, 350)),
        cc.rotateTo(.5, -45)
      ),
      cc.callFunc(() => {
        this._status = Status.idle
      })
    )
    this.blockNode.runAction(seq)
  }
}

