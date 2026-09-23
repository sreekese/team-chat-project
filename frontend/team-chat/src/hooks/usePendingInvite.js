import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPendingInvite, setPendingInvite } from '../utils/invite'

export function usePendingInvite() {
  const [searchParams, setSearchParams] = useSearchParams()
  const pending = getPendingInvite()

  useEffect(() => {
    const code = searchParams.get('invite')
    if (code) {
      setPendingInvite(code)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return pending
}