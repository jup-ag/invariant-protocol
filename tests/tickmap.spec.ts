import { TICK_SEARCH_RANGE, TICK_LIMIT, MAX_TICK } from '@invariant-labs/sdk'
import { Tickmap } from '@invariant-labs/sdk/lib/market'
import {
  findTickmapChanges,
  getNextTick,
  getPreviousTick,
  TickmapChange,
  tickToPosition
} from '@invariant-labs/sdk/src/tickmap'
import { BN } from '@project-serum/anchor'
import { assert } from 'chai'

describe('tickmap', () => {
  describe('next initialized', () => {
    it('simple', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(5), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getNextTick(tickmap, 0, 1) === 5)
    })

    it('multiple', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(50), new BN(10))
      tickmap.bitmap[byte] ^= 1 << bit

      const { byte: byte2, bit: bit2 } = tickToPosition(new BN(100), new BN(10))
      tickmap.bitmap[byte2] ^= 1 << bit2

      assert.ok(getNextTick(tickmap, 0, 10) === 50)
      assert.ok(getNextTick(tickmap, 50, 10) === 100)
    })

    it('current is last', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(0), new BN(10))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getNextTick(tickmap, 0, 10) === null)
    })

    it('just below limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(0), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getNextTick(tickmap, -TICK_SEARCH_RANGE, 1) === 0)
    })

    it('at limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(0), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getNextTick(tickmap, -TICK_SEARCH_RANGE - 1, 1) === null)
    })

    it('further than limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(TICK_LIMIT - 10), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getNextTick(tickmap, -TICK_LIMIT + 1, 1) === null)
    })

    it('hitting the limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }

      assert.ok(getNextTick(tickmap, MAX_TICK - 22, 4) === null)
    })

    it('already at limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }

      assert.ok(getNextTick(tickmap, MAX_TICK - 2, 4) === null)
    })
  })

  describe('previous initialized', () => {
    it('simple', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(-5), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getPreviousTick(tickmap, 0, 1) === -5)
    })

    it('multiple', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(-50), new BN(10))
      tickmap.bitmap[byte] ^= 1 << bit

      const { byte: byte2, bit: bit2 } = tickToPosition(new BN(-100), new BN(10))
      tickmap.bitmap[byte2] ^= 1 << bit2

      assert.ok(getPreviousTick(tickmap, 0, 10) === -50)
      assert.ok(getPreviousTick(tickmap, -50, 10) === -50)
    })

    it('current is last', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(0), new BN(10))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getPreviousTick(tickmap, 0, 10) === 0)
    })

    it('next is last', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(10), new BN(10))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getPreviousTick(tickmap, 0, 10) === null)
    })

    it('just below limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(0), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getPreviousTick(tickmap, TICK_SEARCH_RANGE, 1) === 0)
    })

    it('at limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(0), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getPreviousTick(tickmap, TICK_SEARCH_RANGE + 1, 1) === null)
    })

    it('further than limit', async () => {
      const tickmap: Tickmap = { bitmap: new Array<number>(25000).map(i => (i = 0)) }
      const { byte, bit } = tickToPosition(new BN(-TICK_LIMIT + 1), new BN(1))
      tickmap.bitmap[byte] ^= 1 << bit

      assert.ok(getPreviousTick(tickmap, TICK_LIMIT - 1, 1) === null)
    })
  })
  describe.only('findTickmapChanges', () => {
    describe('added ticks', () => {
      const currentTickmap = [0b0000_0000, 0b0000_1101]
      const nextTickmap = [0b0000_0011, 0b0110_1111]
      it('without offset', () => {
        const tickmapChanges = findTickmapChanges(currentTickmap, nextTickmap, 0)
        const expected: TickmapChange = {
          0: 'added',
          1: 'added',
          9: 'added',
          13: 'added',
          14: 'added'
        }
        assert.equal(JSON.stringify(tickmapChanges), JSON.stringify(expected))
      })
      it('with default offset', () => {
        const tickmapChangesWithOffset = findTickmapChanges(currentTickmap, nextTickmap)
        const expectedWithOffset: TickmapChange = {
          '-100000': 'added',
          '-99999': 'added',
          '-99991': 'added',
          '-99987': 'added',
          '-99986': 'added'
        }
        assert.equal(JSON.stringify(tickmapChangesWithOffset), JSON.stringify(expectedWithOffset))
      })
    })
    describe('removed ticks', () => {
      const currentTickmap = [0b0111_1011, 0b1110_1111]
      const nextTickmap = [0b0010_0010, 0b1000_1111]
      it('without offset', () => {
        const tickmapChanges = findTickmapChanges(currentTickmap, nextTickmap, 0)
        const expected: TickmapChange = {
          0: 'removed',
          3: 'removed',
          4: 'removed',
          6: 'removed',
          13: 'removed',
          14: 'removed'
        }
        assert.equal(JSON.stringify(tickmapChanges), JSON.stringify(expected))
      })
      it('with default offset', () => {
        const tickmapChangesWithOffset = findTickmapChanges(currentTickmap, nextTickmap)
        const expectedWithOffset: TickmapChange = {
          '-100000': 'removed',
          '-99997': 'removed',
          '-99996': 'removed',
          '-99994': 'removed',
          '-99987': 'removed',
          '-99986': 'removed'
        }
        assert.equal(JSON.stringify(tickmapChangesWithOffset), JSON.stringify(expectedWithOffset))
      })
    })
  })
})
