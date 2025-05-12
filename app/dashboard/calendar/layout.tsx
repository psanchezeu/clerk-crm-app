import { EventsProvider } from "./providers/events-provider"

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EventsProvider>
      {children}
    </EventsProvider>
  )
}
