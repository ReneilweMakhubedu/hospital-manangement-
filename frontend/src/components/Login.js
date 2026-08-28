import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

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
      const response = await fetch('http://localhost:5000/api/login', {
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

      if (data.role === 'admin') {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-teal-700 p-6 text-white">

          <div className="flex items-center justify-center gap-3">
            <BrandLogo className="h-10 w-10" />

            <div>
              <p className="text-xl font-bold">PMS</p>
              <p className="text-sm text-teal-100">
                Digital Clinic Operations
              </p>
            </div>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-center">
            Welcome back
          </h2>

          <p className="text-center text-teal-100 mt-1">
            Sign in to your account
          </p>

        </div>

        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
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
                  className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500"
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
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition"
            >
              Login
            </button>

          </form>

        </div>

        <div className="bg-slate-50 px-6 py-4 text-center">

          <p className="text-sm text-slate-600">
            Don't have an account?{' '}

            <button
              onClick={() => navigate('/signup')}
              className="text-teal-700 font-bold hover:underline"
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