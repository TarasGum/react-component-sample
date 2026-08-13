import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * What a browser has to confirm that jsdom cannot.
 *
 * The unit tests own the logic; this file owns the things that only exist once
 * the page is laid out and painted: that every section renders, that the sizing
 * keyed to `pointer: coarse` actually reaches 44px on a phone, that the KaTeX
 * stylesheet arrived, and that the page never scrolls sideways.
 */

const dates = (page: Page) => page.getByRole('group', { name: 'Dates' }).getByRole('button')

const isVisiblySquare = async (target: Locator, minimum: number) => {
  const box = await target.boundingBox()
  if (!box) throw new Error('an on-screen control always has a box')

  return box.width >= minimum && box.height >= minimum
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('every section of the sample renders', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Component sample' })).toBeVisible()

  for (const section of ['Date strip', 'Question', 'Clock and progress']) {
    await expect(page.getByRole('heading', { name: section })).toBeVisible()
  }
})

test('picking a date changes the day that is listed', async ({ page }) => {
  const today = dates(page).and(page.locator('[aria-current="date"]'))
  await expect(today).toHaveAttribute('aria-pressed', 'true')

  // Three days on: a day whose only entry was cancelled, so it lists that entry
  // struck through while the strip shows no dot for it.
  const cancelledDay = dates(page).nth(5)
  await cancelledDay.click()

  await expect(cancelledDay).toHaveAttribute('aria-pressed', 'true')
  await expect(today).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByText('Retro')).toBeVisible()
})

test('submitting colours the answer given and the right one', async ({ page }) => {
  const options = page.getByRole('button', { name: /^[ABCD]\b/ })

  await page.getByRole('button', { name: 'Submit' }).click()

  await expect(page.getByText('your answer')).toBeVisible()
  await expect(options.first()).toHaveClass(/border-destructive/)
  await expect(options.nth(1)).toHaveClass(/border-sage/)

  // Read-only from here: the answers are in.
  await expect(options.first()).toBeDisabled()
})

test('a formula is typeset rather than left as LaTeX', async ({ page }) => {
  const question = page.locator('.katex').first()

  await expect(question).toBeVisible()
  // KaTeX ships its own stylesheet; without it the markup renders as a wall of
  // unstyled letters at the body font size.
  await expect(question).toHaveCSS('font-family', /KaTeX/)
})

test('the numeric answer can be made negative and typeset per cents survive', async ({ page }) => {
  await page.getByRole('button', { name: 'Question 3' }).click()

  // A bare `%` starts a comment in TeX, which used to swallow the rest of the
  // formula. This question carries one on purpose.
  await expect(page.getByText('47.5')).toHaveCount(0)
  await expect(page.locator('.katex').first()).toBeVisible()

  const field = page.getByPlaceholder('Answer')
  await field.fill('47.5')
  await page.getByRole('button', { name: 'Minus' }).click()

  await expect(field).toHaveValue('-47.5')
})

test('the clock counts down in its own field for the hour', async ({ page }) => {
  const clock = page.getByText(/^\d{1,2}:\d{2}:\d{2}$/)

  await expect(clock).toBeVisible()

  const first = await clock.textContent()
  await expect.poll(() => clock.textContent(), { message: 'the clock ticks' }).not.toBe(first)
})

test('the progress bar is drawn only where a target was agreed', async ({ page }) => {
  await expect(page.getByText('23 / 30')).toBeVisible()
  // Two are mounted; the one with no agreed target draws no track at all.
  await expect(page.locator('[data-slot="progress"]')).toHaveCount(1)
})

test('nothing on the page scrolls sideways', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )

  expect(overflow).toBeLessThanOrEqual(0)
})

test('tappable things are thumb-sized on a touch pointer and compact on a mouse', async ({
  page,
  isMobile
}) => {
  // 44px is Apple's floor and the one this design system holds to; a fine
  // pointer keeps the compact controls the system was drawn with, whatever the
  // window is narrowed to.
  const minimum = isMobile ? 44 : 28

  await expect.poll(() => isVisiblySquare(dates(page).first(), minimum)).toBe(true)
  expect(await isVisiblySquare(page.getByRole('button', { name: 'Question 1' }), minimum)).toBe(
    true
  )

  await page.getByRole('button', { name: 'Question 3' }).click()
  expect(await isVisiblySquare(page.getByRole('button', { name: 'Minus' }), minimum)).toBe(true)
})
