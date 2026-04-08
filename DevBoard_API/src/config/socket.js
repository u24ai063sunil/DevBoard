const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

let io

// Track online users — userId → Set of socketIds
const onlineUsers = new Map()

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
      ],
      credentials: true,
    },
  })

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('Authentication required'))

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
      socket.userId   = decoded.id
      socket.userRole = decoded.role
      next()
    } catch (err) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.userId
    logger.info(`Socket connected: ${userId}`)

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set())
    }
    onlineUsers.get(userId).add(socket.id)

    // Join personal room
    socket.join(`user:${userId}`)

    // Broadcast online status to everyone
    io.emit('user:online', { userId })
    logger.info(`User online: ${userId} (${onlineUsers.size} total)`)

    // Join project room
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`)

      const room  = io.sockets.adapter.rooms.get(`project:${projectId}`)
      const count = room ? room.size : 1

      io.to(`project:${projectId}`).emit('room:members', { projectId, count })
    })

    // Leave project room
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`)

      const room  = io.sockets.adapter.rooms.get(`project:${projectId}`)
      const count = room ? room.size : 0

      io.to(`project:${projectId}`).emit('room:members', { projectId, count })
    })

    // Get online status of specific users
    socket.on('presence:check', (userIds) => {
      const statuses = {}
      userIds.forEach((id) => {
        statuses[id] = onlineUsers.has(id) && onlineUsers.get(id).size > 0
      })
      socket.emit('presence:status', statuses)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          onlineUsers.delete(userId)
          // Broadcast offline status
          io.emit('user:offline', { userId })
          logger.info(`User offline: ${userId}`)
        }
      }
    })
  })

  return io
}

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

const isUserOnline = (userId) => {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0
}

const getOnlineUsers = () => Array.from(onlineUsers.keys())

module.exports = { initSocket, getIO, isUserOnline, getOnlineUsers }