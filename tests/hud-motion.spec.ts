import { expect, test } from '@playwright/test'

// Closes F-017. Asserts that the data-attribute state machines that drive
// the recently-shipped HUD CSS animations actually flip in response to
// gameplay state, and that prefers-reduced-motion suppresses the running
// animations. Per the CodeRabbit learning saved on PR #115: for CSS-only
// keyframe animations triggered by a data-attribute, asserting the
// data-attribute flips is sufficient motion coverage; observable rect /
// transform tests are reserved for JS-driven motion (RAF / setInterval).

async function waitFor<T>(
  fn: () => Promise<T | null | false | undefined>,
  timeoutMs: number,
  intervalMs = 120
): Promise<T | null> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const result = await fn()
    if (result) return result as T
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return null
}

test.describe('HUD animation coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/leaderboard**', async (route) => {
      await route.fulfill({
        status: 200,
        json: { scope: 'all', date: null, entries: [], unavailable: true }
      })
    })
  })

  test('ammo-pill data-critical flips when boomstick depletes to 1', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto('/arena/practice')
    await page.getByLabel('Start weapon').selectOption('boomstick')
    await page.getByLabel('Damage').uncheck()
    await page.getByLabel('Freeze room').check()
    await page.getByRole('button', { name: 'Start run' }).click()
    await expect(page.getByTestId('hud')).toBeVisible()

    const ammoPill = page.locator('.armament-ammo')
    await expect(ammoPill).toHaveAttribute('data-critical', 'false')
    await expect(ammoPill.getByText('6')).toBeVisible()

    // Boomstick stock is 6; firing 5 shots leaves 1, the critical state.
    for (let i = 0; i < 5; i++) {
      await page.mouse.click(960, 540)
      await expect(page.getByTestId('weapon-ready')).toContainText('Ready', { timeout: 6000 })
    }

    await expect(ammoPill).toHaveAttribute('data-critical', 'true')
    await expect(ammoPill.getByText('1')).toBeVisible()

    // The pulse keyframe is named ammo-critical-pulse and runs on the
    // <strong>; reading computed animationName confirms the rule applied.
    const animationName = await ammoPill.locator('.ammo-value').evaluate(
      (el) => window.getComputedStyle(el).animationName
    )
    expect(animationName).toBe('ammo-critical-pulse')
  })

  test('score-floater mounts with a valid combo tier on a confirmed kill', async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/arena/practice')
    await page.getByLabel('Start weapon').selectOption('peashooter')
    // Damage stays on so enemies advance and stay reachable; freeze room
    // is off so AI behavior keeps progressing.
    await page.getByLabel('Damage').check()
    await page.getByRole('button', { name: 'Start run' }).click()
    await expect(page.getByTestId('hud')).toBeVisible()

    // Score-floaters unmount ~1.2s after spawn so a stale locator count
    // misses them. A MutationObserver records every floater that ever
    // mounted plus the data-tier attribute it carried, persisted across
    // renders.
    await page.evaluate(() => {
      const w = window as unknown as { __floaterTiers: string[] }
      w.__floaterTiers = []
      new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return
            if (node.matches?.('[data-testid="score-floater"]')) {
              w.__floaterTiers.push(node.getAttribute('data-tier') ?? '')
            }
            const inner = node.querySelectorAll?.('[data-testid="score-floater"]')
            inner?.forEach((el) => w.__floaterTiers.push(el.getAttribute('data-tier') ?? ''))
          })
        }
      }).observe(document.body, { childList: true, subtree: true })
    })

    const sawFloater = await waitFor(async () => {
      await page.mouse.click(960, 540)
      const tiers = await page.evaluate(() => (window as unknown as { __floaterTiers: string[] }).__floaterTiers)
      return tiers.length > 0 ? tiers : null
    }, 30_000)
    expect(sawFloater).not.toBeNull()
    for (const tier of sawFloater ?? []) {
      expect(['base', 'streak', 'rolling', 'rampage']).toContain(tier)
    }

    // Combo timer bar drains via the --combo-time-ratio CSS custom prop on
    // the combo-pill; transform: scaleX(var(...)). At idle the variable
    // is 0; an active combo bumps it above 0. By the time a floater fired
    // the combo was at least 1, so the prop is above 0 in the same window.
    const sawComboTimer = await waitFor(async () => {
      const ratio = await page.getByTestId('combo-pill').evaluate((el) =>
        Number(getComputedStyle(el).getPropertyValue('--combo-time-ratio') || '0')
      )
      return ratio > 0 ? ratio : null
    }, 5_000)
    expect(sawComboTimer).not.toBeNull()
  })

  test('crosshair, damage-indicator, score-floater CSS rules paint distinct variants', async ({ page }) => {
    // Verify each animated HUD element's data-attribute CSS rule actually
    // does something distinct, without depending on enemy AI to mount the
    // element through gameplay. Rule 10 motion coverage is satisfied for
    // CSS-only data-attribute animations by proving the rule paints
    // differently per attribute value; the binding-from-state path is
    // covered by unit tests on the helpers (isAmmoCritical, isEnemyOnCrosshair,
    // damageIndicatorSeverity, scoreFloaterTier) and by the gameplay tests
    // above for ammo-pill and score-floater.
    await page.goto('/arena/practice')
    await page.getByRole('button', { name: 'Start run' }).click()
    await expect(page.getByTestId('hud')).toBeVisible()

    const crosshair = page.getByTestId('crosshair')
    await expect(crosshair).toHaveAttribute('data-locked', /^(true|false)$/)

    // Crosshair: the data-locked='true' rule warms the ::before bar.
    const lockedBackground = await crosshair.evaluate((el) => {
      el.setAttribute('data-locked', 'true')
      return getComputedStyle(el, '::before').backgroundColor
    })
    const unlockedBackground = await crosshair.evaluate((el) => {
      el.setAttribute('data-locked', 'false')
      return getComputedStyle(el, '::before').backgroundColor
    })
    expect(lockedBackground).not.toEqual(unlockedBackground)

    // Damage-indicator + score-floater do not exist in the DOM at idle
    // (the indicator unmounts ~720ms after a hit, and floaters unmount
    // ~1.2s after a kill). Append detached probe elements with the right
    // class + data-attribute, read computed style, then remove. The
    // computed style reflects the global stylesheet so the data-attribute
    // CSS rules apply.
    const probes = await page.evaluate(() => {
      const probe = (className: string, attrs: Record<string, string>): { background: string; color: string; fontSize: string } => {
        const el = document.createElement('div')
        el.className = className
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
        document.body.appendChild(el)
        const style = getComputedStyle(el)
        const result = {
          background: style.backgroundImage || style.background,
          color: style.color,
          fontSize: style.fontSize
        }
        document.body.removeChild(el)
        return result
      }
      return {
        damageMedium: probe('damage-indicator', { 'data-severity': 'medium' }),
        damageHigh: probe('damage-indicator', { 'data-severity': 'high' }),
        floaterStreak: probe('score-floater', { 'data-tier': 'streak' }),
        floaterRampage: probe('score-floater', { 'data-tier': 'rampage' })
      }
    })
    // Damage indicator paints distinct conic gradients per severity.
    expect(probes.damageMedium.background).not.toEqual(probes.damageHigh.background)
    // Score floater escalates color + font-size as the tier climbs.
    expect(probes.floaterStreak.color).not.toEqual(probes.floaterRampage.color)
    expect(probes.floaterStreak.fontSize).not.toEqual(probes.floaterRampage.fontSize)
  })

  test('prefers-reduced-motion suppresses ammo-critical pulse keyframes', async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    try {
      await page.route('**/api/leaderboard**', async (route) => {
        await route.fulfill({
          status: 200,
          json: { scope: 'all', date: null, entries: [], unavailable: true }
        })
      })
      await page.goto('/arena/practice')
      await page.getByLabel('Start weapon').selectOption('boomstick')
      await page.getByLabel('Damage').uncheck()
      await page.getByLabel('Freeze room').check()
      await page.getByRole('button', { name: 'Start run' }).click()
      await expect(page.getByTestId('hud')).toBeVisible()

      for (let i = 0; i < 5; i++) {
        await page.mouse.click(960, 540)
        await expect(page.getByTestId('weapon-ready')).toContainText('Ready', { timeout: 6000 })
      }

      const ammoPill = page.locator('.armament-ammo')
      await expect(ammoPill).toHaveAttribute('data-critical', 'true')

      // Under prefers-reduced-motion the @media block in globals.css sets
      // animation: none on the same selector that normally drives the
      // pulse. Computed animationName drops to 'none'.
      const animationName = await ammoPill.locator('.ammo-value').evaluate(
        (el) => window.getComputedStyle(el).animationName
      )
      expect(animationName).toBe('none')
    } finally {
      await context.close()
    }
  })
})
