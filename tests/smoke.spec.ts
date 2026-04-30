import { expect, test } from '@playwright/test'

test('starts a walk and shoot run', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Flatline' })).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
  await expect.poll(async () => canvasHasPixels(page)).toBe(true)

  await page.getByRole('button', { name: 'Start run' }).click()

  await expect(page.getByTestId('hud')).toBeVisible()
  await expect(page.getByTestId('crosshair')).toBeVisible()
  await expect(page.getByTestId('billboard-debug')).toContainText('front')
  await expect(page.getByTestId('status-line')).toContainText('WASD')
  await page.screenshot({ path: testInfo.outputPath('walk-and-shoot.png'), fullPage: true })
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
