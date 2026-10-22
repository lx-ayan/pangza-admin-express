import "reflect-metadata";
import cors from "cors";
import { json } from "express";
import {
  Application,
  Controller,
  GetMapping,
  Logger,
} from "@pangza/express";

@Controller("/api/hello")
class HelloController {
  @GetMapping("/")
  hello() {
    return { ok: true, message: "pangza starter" };
  }
}

Application.registry(Logger({ level: "info" }))
  .registry(cors())
  .registry(json())
  .scan("src")
  .start();
