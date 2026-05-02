import { expect, test } from '@playwright/test'

test('starts a walk and shoot run', async ({ page }, testInfo) => {
  await page.route('**/api/leaderboard**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 503, json: { error: 'leaderboard unavailable' } })
      return
    }

    await route.fulfill({
      status: 200,
      json: {
        scope: 'all',
        date: null,
        entries: [],
        unavailable: true
      }
    })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Flatline' })).toBeVisible()
  await expect(page.getByTestId('shared-leaderboard')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByTestId('damage-flash')).toBeHidden()
  await expect.poll(async () => canvasHasPixels(page)).toBe(true)

  await page.getByRole('button', { name: 'Start run' }).click()

  await expect(page.getByTestId('hud')).toBeVisible()
  await expect(page.getByTestId('crosshair')).toBeVisible()
  await expect(page.getByTestId('combo-pill')).toContainText('0')
  await expect(page.getByTestId('weapon-ready')).toContainText('Ready')
  await expect(page.getByTestId('weapon-sprite')).toHaveClass(/weapon-peashooter/)
  await expect(page.getByTestId('billboard-debug')).toContainText('front')
  await expect(page.getByTestId('status-line')).toContainText('WASD')
  await page.mouse.click(960, 540)
  await expect(page.getByTestId('status-line')).toContainText(/hurt|dropped/)
  await expect(page.getByText('Hits').locator('..')).toContainText('1')
  await page.keyboard.press('Digit2')
  await expect(page.getByTestId('hud').getByText('Boomstick')).toBeVisible()
  await expect(page.getByTestId('weapon-sprite')).toHaveClass(/weapon-boomstick/)
  await page.mouse.click(960, 540)
  await expect(page.getByTestId('weapon-sprite')).toHaveClass(/weapon-firing/)
  await expect(page.getByTestId('weapon-ready')).toContainText('Recovering')
  await expect(page.getByTestId('weapon-ready')).toContainText('Ready', { timeout: 1200 })
  await expect(page.getByTestId('status-line')).toContainText('Boomstick')
  await expect(page.getByTestId('combo-pill')).toContainText('1')
  await page.keyboard.press('Digit3')
  await expect(page.getByTestId('hud').getByText('Inkblaster')).toBeVisible()
  await expect(page.getByTestId('weapon-sprite')).toHaveClass(/weapon-inkblaster/)
  await page.mouse.click(960, 540)
  await expect(page.getByTestId('weapon-ready')).toContainText('Recovering')
  await expect(page.getByTestId('weapon-ready')).toContainText('Ready', { timeout: 1200 })
  await page.screenshot({ path: testInfo.outputPath('walk-and-shoot.png'), fullPage: true })

  await page.evaluate(() => window.dispatchEvent(new CustomEvent('flatline:force-death')))
  await expect(page.getByTestId('run-summary')).toBeVisible()
  await expect(page.getByTestId('shared-submit')).toBeVisible()
  await page.getByRole('button', { name: 'Submit score' }).click()
  await expect(page.getByRole('button', { name: 'Unavailable' })).toBeVisible()
  await expect(page.getByTestId('leaderboard')).toBeVisible()
  await page.getByRole('button', { name: 'Restart run' }).click()
  await expect(page.getByTestId('hud')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('pause-menu')).toBeVisible()
  await expect(page.getByTestId('settings-panel')).toBeVisible()
  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByTestId('pause-menu')).toBeHidden()
})

test('daily route loads the deterministic daily seed', async ({ page }) => {
  await page.route('**/api/leaderboard**', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        scope: 'daily',
        date: '2026-04-30',
        entries: [],
        unavailable: true
      }
    })
  })
  await page.goto('/arena/daily')
  await expect(page.getByText(/Daily seed flatline-/)).toBeVisible()
  await expect(page.getByTestId('daily-schedule')).toBeVisible()
  await expect(page.getByLabel('Daily spawn order')).toBeVisible()
  await expect(page.getByLabel('Daily hazard schedule')).toBeVisible()
  await expect(page.getByTestId('shared-leaderboard')).toBeVisible()
})

test('practice route exposes tuning controls without leaderboard submission', async ({ page }) => {
  const leaderboardRequests: string[] = []
  await page.route('**/api/leaderboard**', async (route) => {
    leaderboardRequests.push(route.request().method())
    await route.fulfill({
      status: 200,
      json: {
        scope: 'all',
        date: null,
        entries: [],
        unavailable: true
      }
    })
  })

  await page.goto('/arena/practice')
  await expect(page.getByRole('heading', { name: 'Flatline' })).toBeVisible()
  await expect(page.getByTestId('practice-panel')).toBeVisible()
  await expect(page.getByTestId('shared-leaderboard')).toBeHidden()
  await page.getByLabel('Start weapon').selectOption('inkblaster')
  await page.getByLabel('Grunt').uncheck()
  await page.getByLabel('Skitter').uncheck()
  await page.getByLabel('Infinite ammo').check()
  await page.getByLabel('Damage').uncheck()
  await page.getByLabel('Billboard debug').uncheck()
  await page.getByLabel('Freeze room').check()
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.getByTestId('hud').getByText('Inkblaster')).toBeVisible()
  await expect(page.getByTestId('hud').getByText('Brute')).toBeVisible()
  await expect(page.getByTestId('billboard-debug')).toBeHidden()
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('flatline:force-death')))
  await expect(page.getByTestId('run-summary')).toBeVisible()
  await expect(page.getByTestId('shared-submit')).toBeHidden()
  expect(leaderboardRequests).toEqual([])
})

test('mobile touch controls fit the viewport and block page scroll', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'mobile touch controls are covered by the mobile project')

  await page.goto('/')
  await page.getByRole('button', { name: 'Start run' }).click()
  await expect(page.getByTestId('hud')).toBeVisible()
  await expect(page.getByTestId('touch-controls')).toBeVisible()

  const viewport = page.viewportSize()

  if (!viewport) {
    throw new Error('missing viewport')
  }

  await page.evaluate(({ width, height }) => {
    window.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 51,
      pointerType: 'touch',
      clientX: Math.round(width * 0.22),
      clientY: Math.round(height * 0.72),
      bubbles: true,
      cancelable: true
    }))
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 51,
      pointerType: 'touch',
      clientX: Math.round(width * 0.22),
      clientY: Math.round(height * 0.52),
      bubbles: true,
      cancelable: true
    }))
  }, viewport)

  await expect(page.locator('.touch-stick-move')).toBeVisible()
  await page.waitForTimeout(120)
  await page.evaluate(({ width, height }) => {
    window.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 51,
      pointerType: 'touch',
      clientX: Math.round(width * 0.22),
      clientY: Math.round(height * 0.52),
      bubbles: true,
      cancelable: true
    }))
  }, viewport)
  await expect(page.locator('.touch-stick-move')).toBeHidden()

  await page.evaluate(({ width, height }) => {
    window.scrollTo(0, 80)
    window.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 52,
      pointerType: 'touch',
      clientX: Math.round(width * 0.72),
      clientY: Math.round(height * 0.62),
      bubbles: true,
      cancelable: true
    }))
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 52,
      pointerType: 'touch',
      clientX: Math.round(width * 0.86),
      clientY: Math.round(height * 0.56),
      bubbles: true,
      cancelable: true
    }))
  }, viewport)

  await expect(page.locator('.touch-stick-look')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect.poll(async () => {
    return page.getByTestId('hud').evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0
    })
  }).toBe(true)
})

async function canvasHasPixels(page: import('@playwright/test').Page) {
  return page.locator('canvas').evaluate((element) => {
    const canvas = element as HTMLCanvasElement
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')

    if (!gl) {
      return false
    }

    const width = gl.drawingBufferWidth
    const height = gl.drawingBufferHeight
    const pixels = new Uint8Array(4 * 9)
    const points = [
      [0.25, 0.25],
      [0.5, 0.25],
      [0.75, 0.25],
      [0.25, 0.5],
      [0.5, 0.5],
      [0.75, 0.5],
      [0.25, 0.75],
      [0.5, 0.75],
      [0.75, 0.75]
    ]

    points.forEach(([x, y], index) => {
      gl.readPixels(
        Math.floor(width * x),
        Math.floor(height * y),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
        index * 4
      )
    })

    return pixels.some((value) => value > 24)
  })
}
