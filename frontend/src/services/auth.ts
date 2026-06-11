import { apiClient } from '../lib/apiClient';
import type { AuthPayload, User } from '../types';

interface SuccessEnvelope<T> {
  success: boolean;
  data: T;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<AuthPayload> {
  const res = await apiClient.post<SuccessEnvelope<AuthPayload>>('/auth/register', input);
  return res.data.data;
}

export async function login(input: LoginInput): Promise<AuthPayload> {
  const res = await apiClient.post<SuccessEnvelope<AuthPayload>>('/auth/login', input);
  return res.data.data;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<SuccessEnvelope<User>>('/auth/me');
  return res.data.data;
}
