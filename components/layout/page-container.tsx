import { ReactNode } from "react"

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`container mx-auto py-6 px-4 max-w-screen-xl ${className}`}>
      {children}
    </div>
  )
}
