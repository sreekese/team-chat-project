import { avatarColor, initials } from '../utils/format'

export function Avatar({ user, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${avatarColor(
        user,
      )} ${sizes[size]} ${className}`}
      title={user?.name || user?.username || 'Unknown'}
    >
      {initials(user)}
    </div>
  )
}