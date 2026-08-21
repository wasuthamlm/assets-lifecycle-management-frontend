import { Component, type ReactNode } from 'react'
import { Button } from './ui/Button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">เกิดข้อผิดพลาดที่ไม่คาดคิด</p>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            กรุณาลองโหลดหน้าใหม่อีกครั้ง หากยังพบปัญหาโปรดติดต่อผู้ดูแลระบบ
          </p>
          <Button onClick={() => window.location.reload()}>โหลดหน้าใหม่</Button>
        </div>
      )
    }
    return this.props.children
  }
}
