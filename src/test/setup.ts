import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does no layout, so it has no `scrollIntoView` — and both strips call it
// to bring the selected item back on screen. The Playwright run is what checks
// that the scrolling itself works.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

afterEach(cleanup)
