import usePresenceStore from '../store/presenceStore'

const OnlineDot = ({ userId, size = 'sm' }) => {
  const onlineUsers = usePresenceStore((s) => s.onlineUsers)
  const online      = onlineUsers.has(userId)

  const sizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
  }

  return (
    <span className={`
      ${sizes[size] || sizes.sm}
      rounded-full shrink-0
      ${online
        ? 'bg-green-400 shadow-sm shadow-green-400/50'
        : 'bg-gray-600'
      }
    `}/>
  )
}

export default OnlineDot