import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { brand } from '../brand';
import API_BASE from '../api';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', email);
      if (typeof data.onboardingComplete !== 'undefined') {
        localStorage.setItem(
          'onboardingComplete',
          data.onboardingComplete ? '1' : '0'
        );
      }

      if (data.role === 'super_admin') {
        navigate('/cms');
      } else if (data.role === 'hr') {
        navigate('/hr');
      } else if (data.role === 'finance') {
        navigate('/finance');
      } else if (data.role === 'payroll') {
        navigate('/payroll');
      } else if (data.role === 'procurement') {
        navigate('/procurement');
      } else if (data.role === 'pharmacy') {
        navigate('/pharmacy');
      } else if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'doctor') {
        navigate('/doctor');
      } else if (!data.onboardingComplete) {
        navigate('/patient/onboarding');
      } else {
        navigate('/patient/dashboard');
      }

    } catch (error) {
      console.error(error);
      setError(
        'Cannot connect to the server. Please make sure the backend is running.'
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-4">

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#8b8b8b]/25 bg-[#ffffff] shadow-lg">

        <div className="border-b border-[#8b8b8b]/25 bg-[#ffffff] p-6">

          <div className="flex items-center justify-center gap-3">
            <BrandLogo className="h-10 w-10" />

            <div>
              <p className="text-xl font-bold text-[#1f1f1f]">{brand.shortName}</p>
              <p className="text-sm text-[#e41e1f]">
                {brand.hospital}
              </p>
            </div>
          </div>

          <h2 className="mt-6 text-center text-2xl font-bold text-[#1f1f1f]">
            Welcome back
          </h2>

          <p className="mt-1 text-center text-sm text-[#8b8b8b]">
            Sign in to your account
          </p>

        </div>

        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#1f1f1f] mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-[#8b8b8b]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
                required
              />
            </div>

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#1f1f1f] mb-2"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-[#8b8b8b]/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e41e1f]"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8b8b8b]"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>

            </div>

            {error && (
              <div className="rounded-lg bg-[#f8f8f8] border border-[#e41e1f]/40 px-4 py-3 text-sm text-[#e41e1f]">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#e41e1f] text-[#ffffff] py-3 rounded-lg font-bold hover:opacity-90 transition"
            >
              Login
            </button>

          </form>

        </div>

        <div className="bg-[#f8f8f8] px-6 py-4 text-center">

          <p className="text-sm text-[#8b8b8b]">
            Don't have an account?{' '}

            <button
              onClick={() => navigate('/signup')}
              className="text-[#e41e1f] font-bold hover:underline"
            >
              Sign up
            </button>
          </p>

        </div>

      </div>

    </div>
  );
};

export default Login;