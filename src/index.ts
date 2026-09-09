import { json, NextFunction, response, Router } from "express";
import Application from "./core/Application";
import cors from 'cors';
import Auth from "./core/Auth";

Application.start().registry(Auth).registry(cors()).registry(json());
 
Application.GET<string>('/api', (req: any) => {
    return 'hello world';
});

Application.GET<{username: string}[]>('/user/list', () => {
  return [{username: 'admin'}, {username: 'user'}];
});