import type { AuthResponse } from "./types";

// DEPRECATED: These functions are no longer used
// Authentication is now handled via src/api/auth.ts using React Query

export const postLogin = async (_username: string, _password: string):Promise<AuthResponse> => {
  //Mock response
  return Promise.resolve({username: "test", email: "email@gmail.com", token: "token12324352364376543736357"});
}

export const postLogout = async ():Promise<null> => {
  //Mock response
  return Promise.resolve(null);
}

export const postRegister = async (_username: string, _email: string, _password: string):Promise<AuthResponse> => {
  //Mock response
  return Promise.resolve({username: "test", email: "test@gmail.com", token: "token12324352364376543736357"});
}