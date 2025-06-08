import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/images')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/images"!</div>
}
