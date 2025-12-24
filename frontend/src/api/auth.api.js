import api from './axiosClient';

export const signup = (email, password) =>
  api.post('/auth/register', { email, password });

export const login = (email, password) =>
  api.post('/auth/login', {
    "email": email,
    "password": password,
  }, {
    // headers: {
    //   'Content-Type': 'application/x-www-form-urlencoded',
    // },
  });

export const getMe = () =>
  api.get('/users/me');
