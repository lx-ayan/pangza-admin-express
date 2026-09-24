import { AiModel } from "@/framework/langchain/decorators";
import { Component } from "@/framework/Service";
import { ChatOpenAI } from "@langchain/openai";

@Component()
export default class AiModelFactory {
    deepseekModel() {
        return new ChatOpenAI({
            model: "deepseek-r1",
        })
    }
}