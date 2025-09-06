"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  email: string
  isVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("auth-token")
    const userStr = localStorage.getItem("user")

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        verifyToken(token, user)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        clearAuth()
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  const verifyToken = async (token: string, user: User) => {
    try {
      const response = await fetch("/api/auth/verify-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const data = await response.json()
        setAuthState({
          user: data.user,
          token,
          isLoading: false,
          isAuthenticated: true,
        })
      } else {
        clearAuth()
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      clearAuth()
    }
  }

  const login = (token: string, user: User) => {
    localStorage.setItem("auth-token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setAuthState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    })
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authState.token}`,
        },
      })
    } catch (error) {
      console.error("Logout API call failed:", error)
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user")
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }

  const getAuthHeaders = () => {
    if (!authState.token) return {}
    return {
      Authorization: `Bearer ${authState.token}`,
    }
  }

  return {
    ...authState,
    login,
    logout,
    getAuthHeaders,
  }
}
