import OnlineDot from './OnlineDot'

const UserAvatar = ({ user, size = 'md', showOnline = true }) => {
  const sizes = {
    sm: { outer: 'w-7 h-7', text: 'text-xs', dot: 'xs' },
    md: { outer: 'w-9 h-9', text: 'text-sm', dot: 'sm' },
    lg: { outer: 'w-12 h-12', text: 'text-base', dot: 'md' },
  }

  const s = sizes[size] || sizes.md

  return (
    <div className="relative inline-flex shrink-0">
      <div className={`${s.outer} rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center`}>
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"/>
        ) : (
          <span className={`text-white font-medium ${s.text}`}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
      </div>

      {showOnline && user?._id && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <OnlineDot userId={user._id} size={s.dot} />
        </span>
      )}
    </div>
  )
}

export default UserAvatar