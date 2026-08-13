/**
 * The slice of the API's types these components read.
 *
 * In the app they came from these are inferred end to end from the server, so
 * renaming a field there breaks this build rather than the running page. Here
 * they are written out, because the sample has no server.
 */

export type SessionFormat = 'onsite' | 'remote'

export type SessionStatus = 'scheduled' | 'done' | 'missed' | 'cancelled'

/** One booking on a calendar. */
export type CalendarEntry = {
  id: string
  /** An instant, ISO 8601. The wall-clock time is derived, never stored. */
  startsAt: string
  format: SessionFormat
  title: string | null
  status: SessionStatus
  /** Needs the viewer's attention, so the dot on its day is a warning. */
  flagged: boolean
}

export type Option = { label: string; text: string }

export type QuestionKind = 'single' | 'matching' | 'numeric'

/**
 * One question of a quiz.
 *
 * `answer` is null until the quiz is submitted — the server does not send the
 * key to somebody who could still change their mind.
 */
export type Question = {
  id: string
  position: number
  /** May carry `$…$` / `$$…$$` LaTeX. */
  text: string
  kind: QuestionKind
  imageUrls: string[]
  maxPoints: number
  options: Option[] | { left: Option[]; right: Option[] } | null
  given: string | Record<string, string> | null
  answer: string | Record<string, string> | null
  pointsAwarded: number | null
}
