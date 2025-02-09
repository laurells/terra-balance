import api from "@/config/api";
import axios from "axios";
import { getCookie, deleteCookie, setCookie } from "cookies-next";
import React, { useState, useEffect, useContext, createContext } from "react";

type authType = {
  user: null | User;
  register: (
    email: string,
    fullname: string,
    password: string,
    shippingAddress: string,
    phone: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
  forgotPassword?: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  logout?: () => void;
};

const initialAuth: authType = {
  user: null,
  register: async () => {
    console.error('Register method not implemented');
    return { success: false, message: 'Register not implemented' };
  },
  login: async () => {
    console.error('Login method not implemented');
    return { success: false, message: 'Login not implemented' };
  }
};

const authContext = createContext<authType>(initialAuth);

type User = {
  id: number;
  email: string;
  fullname: string;
  shippingAddress?: string;
  phone?: string;
  token: string;
};

// Provider component that wraps your app and makes auth object ...
// ... available to any child component that calls useAuth().
export function ProvideAuth({ children }: { children: React.ReactNode }) {
  const auth = useProvideAuth();
  
  // Add debug logging
  useEffect(() => {
    console.log('AuthContext value:', auth);
  }, [auth]);

  // Ensure all methods are defined
  const safeAuth = {
    ...initialAuth,
    ...auth,
    register: auth.register || initialAuth.register,
    login: auth.login || initialAuth.login,
  };

  return <authContext.Provider value={safeAuth}>{children}</authContext.Provider>;
}
// Hook for child components to get the auth object ...
// ... and re-render when it changes.
export const useAuth = () => {
  const context = useContext(authContext);
  
  // Additional safeguards
  if (!context.login) {
    console.error('Login method is undefined in AuthContext');
    context.login = async () => {
      console.error('Fallback login method called');
      return { success: false, message: 'Login method not implemented' };
    };
  }

  return context;
};

// Provider hook that creates auth object and handles state
function useProvideAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initialAuth = getCookie("user");
    if (initialAuth) {
      const initUser = JSON.parse(initialAuth as string);
      setUser(initUser);
    }
  }, []);

  useEffect(() => {
    setCookie("user", user);
  }, [user]);

  const register = async (
    email: string,
    fullname: string,
    password: string,
    shippingAddress: string,
    phone: string
  ) => {
    try {
      console.log('Attempting registration with:', email, fullname);
      const response = await api.post(
        `/api/v1/auth/register`,
        {
          email,
          fullname,
          password,
          shippingAddress,
          phone,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Registration response:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.id || !response.data.token) {
        console.error('Invalid registration response structure:', response.data);
        return {
          success: false,
          message: 'Invalid server response',
        };
      }

      const user: User = {
        id: +response.data.id,
        email,
        fullname,
        phone: phone || '',
        shippingAddress: shippingAddress || '',
        token: response.data.token,
      };
      
      setUser(user);
      return {
        success: true,
        message: "registration successful",
      };
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Server error response:', err.response.data);
        return {
          success: false,
          message: err.response.data.error || 'Registration failed',
        };
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        return {
          success: false,
          message: 'No response from server',
        };
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', err.message);
        return {
          success: false,
          message: 'Network error',
        };
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const response = await api.post(
        `/api/v1/auth/login`,
        {
          email,
          password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Login response:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.user || !response.data.token) {
        console.error('Invalid login response structure:', response.data);
        return {
          success: false,
          message: 'Invalid server response',
        };
      }

      const loginResponse = response.data;
      const user: User = {
        id: +loginResponse.user.id,
        email,
        fullname: loginResponse.user.fullname,
        phone: loginResponse.user.phone || '',
        shippingAddress: loginResponse.user.shippingAddress || '',
        token: loginResponse.token,
      };
      
      setUser(user);
      return {
        success: true,
        message: "login successful",
      };
    } catch (err: any) {
      console.error('Login error:', err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error('Server error response:', err.response.data);
        return {
          success: false,
          message: err.response.data.error || 'Login failed',
        };
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        return {
          success: false,
          message: 'No response from server',
        };
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', err.message);
        return {
          success: false,
          message: 'Network error',
        };
      }
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_PROD_BACKEND_URL}/api/v1/auth/forgot-password`,
        {
          email,
        }
      );
      const forgotPasswordResponse = response.data;
      setUser(user);
      return {
        success: forgotPasswordResponse.success,
        message: "reset email sent",
      };
    } catch (err) {
      console.log(err);
      return {
        success: false,
        message: "something went wrong",
      };
    }
  };

  const logout = () => {
    setUser(null);
    deleteCookie("user");
  };

  // Return the user object and auth methods
  return {
    user,
    register,
    login,
    forgotPassword,
    logout,
  };
}